import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  normalizeApiUrl,
  saveCredentials,
  validateCredentials,
} from "@/lib/auth"
import {
  Cloud,
  Server,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react"

type Step = "instance" | "token"
type HostType = "cloud" | "self-hosted"

export default function Onboarding() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("instance")
  const [hostType, setHostType] = useState<HostType>("cloud")
  const [customUrl, setCustomUrl] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const apiUrl =
    hostType === "cloud"
      ? import.meta.env.VITE_COOLIFY_API_URL
      : normalizeApiUrl(customUrl)

  const canContinueToToken =
    hostType === "cloud" || customUrl.trim().length > 0

  const handleConnect = async () => {
    setError("")
    setLoading(true)
    try {
      await validateCredentials(apiUrl, token.trim())
      saveCredentials(apiUrl, token.trim())
      setDirection("forward")
      navigate("/app", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de se connecter")
    } finally {
      setLoading(false)
    }
  }

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col min-h-screen">

        {/* ── Étape 1 : choix de l'instance ── */}
        {step === "instance" && (
          <>
            {/* Zone hero */}
            <div
              className="flex-1 flex flex-col items-center justify-center gap-5 px-6"
              style={{ paddingTop: "var(--safe-area-top)" }}
            >
              <div className="size-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
                <Server className="size-10 text-primary-foreground" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">Mobilify</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Coolify in your pocket
                </p>
              </div>
            </div>

            {/* Zone de sélection */}
            <div
              className="px-4 space-y-3 pt-2"
              style={{
                paddingBottom: "calc(var(--safe-area-bottom) + 1.5rem)",
              }}
            >
              {/* Coolify Cloud */}
              <Card
                className={cn(
                  "cursor-pointer transition-all active:scale-[0.98]",
                  hostType === "cloud"
                    ? "border-primary"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setHostType("cloud")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      hostType === "cloud"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Cloud className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Coolify Cloud</p>
                    <p className="text-xs text-muted-foreground">
                      app.coolify.io
                    </p>
                  </div>
                  {hostType === "cloud" && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </CardContent>
              </Card>

              {/* Self-hosted */}
              <Card
                className={cn(
                  "cursor-pointer transition-all active:scale-[0.98]",
                  hostType === "self-hosted"
                    ? "border-primary"
                    : "border-border hover:bg-muted/30"
                )}
                onClick={() => setHostType("self-hosted")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      hostType === "self-hosted"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Server className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Self-hosted</p>
                    <p className="text-xs text-muted-foreground">
                      Your own instance
                    </p>
                  </div>
                  {hostType === "self-hosted" && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </CardContent>
              </Card>

              {hostType === "self-hosted" && (
                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-xs">
                    Instance URL
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://coolify.example.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode="url"
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setStep("token")}
                disabled={!canContinueToToken}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* ── Étape 2 : token API ── */}
        {step === "token" && (
          <>
            <div
              className="flex items-center px-2"
              style={{ paddingTop: "calc(var(--safe-area-top) + 0.5rem)" }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setError("")
                  setStep("instance")
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
            </div>

            <div className="flex-1 px-4 pt-6 space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  API Token
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Create one in your Coolify dashboard under{" "}
                  <span className="text-foreground font-medium">
                    Settings → API Tokens
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    placeholder="coo_..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pr-10"
                    autoCapitalize="none"
                    autoCorrect="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && token.trim()) handleConnect()
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-8 text-muted-foreground"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>

            <div
              className="px-4"
              style={{
                paddingBottom: "calc(var(--safe-area-bottom) + 1.5rem)",
              }}
            >
              <Button
                className="w-full"
                onClick={handleConnect}
                disabled={loading || !token.trim()}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </>
        )}
      </div>
    </cap-page>
  )
}
