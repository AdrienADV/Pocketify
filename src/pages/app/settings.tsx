import { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useQueryClient } from "@tanstack/react-query"
import { useInstanceHealth, useInstanceVersion } from "@/lib/api/instance"
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
import { cn } from "@/lib/utils"
import { LogOut, Server, User, Key, Loader2, ClipboardPaste, CheckCircle2, XCircle, Eye, EyeOff, Activity, BadgeInfo } from "lucide-react"
import Header from "@/components/header"
import { toast } from "sonner"

type TokenStatus = "idle" | "checking" | "valid" | "invalid"

export default function Settings() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingToken, setEditingToken] = useState(false)
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("idle")
  const [tokenError, setTokenError] = useState("")

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team } = useCurrentTeam()
  const {
    data: version,
    isPending: versionPending,
    isError: versionError,
  } = useInstanceVersion()
  const {
    data: health,
    isPending: healthPending,
    isError: healthError,
  } = useInstanceHealth()
  const apiUrl = getApiUrl().replace("/api/v1", "")
  const isHealthy = health?.toUpperCase() === "OK"
  const apiStatus = healthPending
    ? "Checking"
    : healthError
      ? "Unavailable"
      : isHealthy
        ? "Online"
        : "Unknown"
  const currentToken = getToken() ?? ""
  const maskedToken = currentToken.length > 8
    ? `${currentToken.slice(0, 4)}${"•".repeat(8)}${currentToken.slice(-4)}`
    : "•".repeat(currentToken.length)

  // Auto-validation with debounce
  useEffect(() => {
    if (!token.trim()) {
      setTokenStatus("idle")
      setTokenError("")
      return
    }

    setTokenStatus("checking")
    setTokenError("")

    const timer = setTimeout(async () => {
      try {
        await validateCredentials(getApiUrl(), token.trim())
        setTokenStatus("valid")
      } catch (e) {
        setTokenStatus("invalid")
        setTokenError(e instanceof Error ? e.message : "Invalid token")
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [token])

  const handleClose = () => {
    if (saving) return
    setEditingToken(false)
    setToken("")
    setShowToken(false)
    setTokenStatus("idle")
    setTokenError("")
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
      setToken(value.trim())
    } catch {
      toast.error("Nothing in clipboard")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      saveCredentials(getApiUrl(), token.trim())
      queryClient.clear()
      toast.success("Token updated")
      setTimeout(handleClose, 600)
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

              <section className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                  Instance
                </h2>
                <Card className="py-0">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Server className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">URL</p>
                        <p className="text-sm font-medium truncate">{apiUrl}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Activity className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">API Status</p>
                        <p className={cn(
                          "text-sm font-medium truncate",
                          healthError && "text-destructive",
                          isHealthy && "text-green-600 dark:text-green-500",
                        )}>
                          {apiStatus}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 px-4 py-3">
                      <BadgeInfo className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Version</p>
                        <p className={cn("text-sm font-medium truncate", versionError && "text-destructive")}>
                          {versionPending ? "Checking" : versionError ? "Unavailable" : version}
                        </p>
                      </div>
                    </div>
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
          <DrawerFooter className="mt-0 space-y-3">
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="coo_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={cn(
                    "pr-10 font-mono",
                    tokenStatus === "valid" && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50",
                    tokenStatus === "invalid" && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                  )}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-8 text-muted-foreground"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void handlePaste()}
              >
                <ClipboardPaste className="size-4" />
                Paste
              </Button>

              {tokenStatus === "checking" && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Checking…
                </p>
              )}
              {tokenStatus === "valid" && (
                <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
                  <CheckCircle2 className="size-3.5" />
                  Token valid
                </p>
              )}
              {tokenStatus === "invalid" && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircle className="size-3.5" />
                  {tokenError}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={saving || tokenStatus !== "valid"}
              onClick={() => void handleSave()}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
