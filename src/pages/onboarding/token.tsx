import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  normalizeApiUrl,
  saveCredentials,
  validateCredentials,
} from "@/lib/auth"
import { Clipboard } from "@capacitor/clipboard"
import { ChevronLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react"

type HostType = "cloud" | "self-hosted"
type TokenStatus = "idle" | "checking" | "valid" | "invalid"

export default function OnboardingToken() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { state } = useLocation()

  const hostType: HostType = state?.hostType ?? "cloud"

  const [customUrl, setCustomUrl] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("idle")
  const [tokenError, setTokenError] = useState("")
  const [tokenFocused, setTokenFocused] = useState(false)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const apiUrl =
    hostType === "cloud"
      ? import.meta.env.VITE_COOLIFY_API_URL
      : normalizeApiUrl(customUrl)

  const canCheck =
    token.trim().length > 0 &&
    (hostType === "cloud" || customUrl.trim().length > 0)

  useEffect(() => {
    if (!canCheck) {
      setTokenStatus("idle")
      setTokenError("")
      return
    }

    setTokenStatus("checking")
    setTokenError("")

    const timer = setTimeout(async () => {
      try {
        await validateCredentials(apiUrl, token.trim())
        setTokenStatus("valid")
      } catch (e) {
        setTokenStatus("invalid")
        setTokenError(e instanceof Error ? e.message : "Invalid token")
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [token, customUrl, apiUrl, canCheck])

  const handleBack = () => {
    setDirection("back")
    navigate(-1)
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      if (tokenStatus !== "valid") {
        await validateCredentials(apiUrl, token.trim())
      }
      saveCredentials(apiUrl, token.trim())
      setDirection("forward")
      navigate("/app", { replace: true })
    } catch (e) {
      setTokenStatus("invalid")
      setTokenError(e instanceof Error ? e.message : "Unable to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col min-h-screen">
        <div
          className="flex items-center px-2"
          style={{ paddingTop: "calc(var(--safe-area-top) + 0.5rem)" }}
        >
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="size-5" />
          </Button>
        </div>

        <div className="flex-1 px-4 pt-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Connect</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {hostType === "cloud" ? (
                <>
                  Create a token in your Coolify dashboard under{" "}
                  <span className="text-foreground font-medium">
                    Settings → API Tokens
                  </span>
                </>
              ) : (
                <>
                  Enter your instance URL and create a token under{" "}
                  <span className="text-foreground font-medium">
                    Settings → API Tokens
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="space-y-4">
            {hostType === "self-hosted" && (
              <div className="space-y-1.5">
                <Label htmlFor="url" className="text-sm">
                  Instance URL
                </Label>
                <Input
                  id="url"
                  placeholder="https://coolify.example.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  inputMode="url"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="token" className="text-sm">
                API Token
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  placeholder="coo_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={cn(
                    "pr-10",
                    tokenStatus === "valid" && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50",
                    tokenStatus === "invalid" && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
                  )}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="new-password"
                  onFocus={() => setTokenFocused(true)}
                  onBlur={() => setTokenFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCheck) handleConnect()
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

              {tokenFocused && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    Clipboard.read().then(({ value }) => {
                      if (value) setToken(value)
                    })
                  }}
                >
                  Paste
                </Button>
              )}

              {/* Validation status */}
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
            disabled={loading || !canCheck || tokenStatus === "checking" || tokenStatus === "invalid"}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Connecting…" : "Connect"}
          </Button>
        </div>
      </div>
    </cap-page>
  )
}
