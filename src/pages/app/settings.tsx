import { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useQueryClient } from "@tanstack/react-query"
import { useCurrentTeam } from "@/lib/api/teams"
import { clearCredentials, getApiUrl, getToken, saveCredentials, validateCredentials } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Clipboard } from "@capacitor/clipboard"
import { LogOut, Server, User, Key, Loader2, ClipboardPaste, CheckCircle2, XCircle } from "lucide-react"
import Header from "@/components/header"
import { toast } from "sonner"

type VerifyState = "idle" | "verifying" | "valid" | "invalid"

export default function Settings() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingToken, setEditingToken] = useState(false)
  const [token, setToken] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifyState, setVerifyState] = useState<VerifyState>("idle")

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team } = useCurrentTeam()
  const apiUrl = getApiUrl().replace("/api/v1", "")
  const currentToken = getToken() ?? ""
  const maskedToken = currentToken.length > 8
    ? `${currentToken.slice(0, 4)}${"•".repeat(8)}${currentToken.slice(-4)}`
    : "•".repeat(currentToken.length)

  const handleClose = () => {
    if (saving) return
    setEditingToken(false)
    setToken("")
    setVerifyState("idle")
  }

  const handleLogout = () => {
    queryClient.clear()
    clearCredentials()
    setDirection("back")
    navigate("/onboarding", { replace: true })
  }

  const handlePaste = async () => {
    try {
      const { value } = await Clipboard.read()
      console.log("[settings] pasted value:", value)
      setToken(value.trim())
      setVerifyState("idle")
    } catch {
      toast.error("Nothing in clipboard")
    }
  }

  const handleVerifyAndSave = async () => {
    const trimmed = token.trim()
    if (!trimmed) return
    setVerifyState("verifying")
    try {
      await validateCredentials(getApiUrl(), trimmed)
      setVerifyState("valid")
      setSaving(true)
      saveCredentials(getApiUrl(), trimmed)
      queryClient.clear()
      toast.success("Token updated")
      setTimeout(handleClose, 600)
    } catch {
      setVerifyState("invalid")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <cap-page ref={pageRef}>
        <div className="flex flex-col h-full">
          <Header title="Settings" showBack={false} />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-6 pb-(--safe-area-bottom)">

              <section className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                  Account
                </h2>
                <Card className="py-0">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <User className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Team</p>
                        <p className="text-sm font-medium truncate">{team?.name ?? "—"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Server className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Instance</p>
                        <p className="text-sm font-medium truncate">{apiUrl}</p>
                      </div>
                    </div>
                    <Separator />
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/50"
                      onClick={() => setEditingToken(true)}
                    >
                      <Key className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">API Token</p>
                        <p className="text-sm font-mono truncate">{maskedToken}</p>
                      </div>
                      <span className="text-xs text-primary shrink-0">Edit</span>
                    </button>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Disconnect
                </Button>
              </section>
            </div>
          </div>
        </div>
      </cap-page>

      <Drawer open={editingToken} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>API Token</DrawerTitle>
            <DrawerDescription>Paste your Coolify API token to update it.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="mt-0">
            <Input
              type="password"
              placeholder="Tap Paste to fill"
              value={token}
              className="h-12 w-full text-base font-mono"
            />

            {verifyState === "valid" && (
              <div className="flex items-center gap-2 text-sm text-green-600 px-1">
                <CheckCircle2 className="size-4 shrink-0" />
                Token valid
              </div>
            )}
            {verifyState === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-destructive px-1">
                <XCircle className="size-4 shrink-0" />
                Invalid token — check your key and instance URL
              </div>
            )}

            <Button
              variant="outline"
              className="h-12 text-base gap-2"
              onClick={() => void handlePaste()}
            >
              <ClipboardPaste className="size-4" />
              Paste
            </Button>

            <Button
              className="h-12 text-base"
              disabled={!token.trim() || verifyState === "verifying" || verifyState === "valid"}
              onClick={() => void handleVerifyAndSave()}
            >
              {verifyState === "verifying" && <Loader2 className="size-5 animate-spin" />}
              {verifyState === "verifying" ? "Verifying…" : "Verify & Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
