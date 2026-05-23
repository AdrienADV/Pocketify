import { useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useQueryClient } from "@tanstack/react-query"
import { $api } from "@/lib/api"
import { clearCredentials, getApiUrl, getToken, saveCredentials, validateCredentials } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LogOut, Server, User, Key, Eye, EyeOff, Loader2, Check } from "lucide-react"
import Header from "@/components/header"
import { toast } from "sonner"

export default function Settings() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingToken, setEditingToken] = useState(false)
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team } = $api.useQuery("get", "/teams/current")
  const apiUrl = getApiUrl().replace("/api/v1", "")
  const currentToken = getToken() ?? ""
  const maskedToken = currentToken.length > 8
    ? `${currentToken.slice(0, 4)}${"•".repeat(8)}${currentToken.slice(-4)}`
    : "•".repeat(currentToken.length)

  const handleLogout = () => {
    queryClient.clear()
    clearCredentials()
    setDirection("back")
    navigate("/onboarding", { replace: true })
  }

  const handleSaveToken = async () => {
    const trimmed = token.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await validateCredentials(getApiUrl(), trimmed)
      saveCredentials(getApiUrl(), trimmed)
      queryClient.clear()
      setEditingToken(false)
      setToken("")
      toast.success("Token updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid token")
    } finally {
      setSaving(false)
    }
  }

  return (
    <cap-page ref={pageRef}>
      <Header title="Settings" showBack={false} />

      <div className="p-4 space-y-6 pb-6">

        {/* Compte */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Account
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <User className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="text-sm font-medium truncate">{team?.name ?? "—"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Server className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Instance</p>
                  <p className="text-sm font-medium truncate">{apiUrl}</p>
                </div>
              </div>
              <Separator />
              <div className="px-4 py-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <Key className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">API Token</p>
                    {editingToken ? null : (
                      <p className="text-sm font-mono truncate">{maskedToken}</p>
                    )}
                  </div>
                  {!editingToken && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => { setEditingToken(true); setShowToken(false) }}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {editingToken && (
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-xs">New token</Label>
                    <div className="relative">
                      <Input
                        id="token"
                        type={showToken ? "text" : "password"}
                        placeholder="coo_..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="pr-10 text-sm"
                        autoCapitalize="none"
                        autoCorrect="off"
                        onKeyDown={(e) => { if (e.key === "Enter" && token.trim()) void handleSaveToken() }}
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={saving || !token.trim()}
                        onClick={() => void handleSaveToken()}
                      >
                        {saving
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Check className="size-3.5" />
                        }
                        {saving ? "Validating…" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => { setEditingToken(false); setToken("") }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Déconnexion */}
        <section>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="size-4" />
            Disconnect
          </Button>
        </section>
      </div>
    </cap-page>
  )
}
