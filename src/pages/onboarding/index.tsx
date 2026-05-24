import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Cloud, Server, Check } from "lucide-react"

type HostType = "cloud" | "self-hosted"

export default function Onboarding() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  const [hostType, setHostType] = useState<HostType>("cloud")

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const handleContinue = () => {
    setDirection("forward")
    navigate("/onboarding/token", { state: { hostType } })
  }

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col min-h-screen">
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

        <div
          className="px-4 space-y-3 pt-2"
          style={{
            paddingBottom: "calc(var(--safe-area-bottom) + 1.5rem)",
          }}
        >
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
                <p className="text-xs text-muted-foreground">app.coolify.io</p>
              </div>
              {hostType === "cloud" && (
                <Check className="size-4 text-primary shrink-0" />
              )}
            </CardContent>
          </Card>

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

          <Button className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </cap-page>
  )
}
