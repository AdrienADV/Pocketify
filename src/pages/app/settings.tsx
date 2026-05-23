import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useQueryClient } from "@tanstack/react-query"
import { $api } from "@/lib/api"
import { clearCredentials, getApiUrl } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, Server, User } from "lucide-react"
import Header from "@/components/header"

export default function Settings() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team } = $api.useQuery("get", "/teams/current")
  const apiUrl = getApiUrl().replace("/api/v1", "")

  const handleLogout = () => {
    queryClient.clear()
    clearCredentials()
    setDirection("back")
    navigate("/onboarding", { replace: true })
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
                  <p className="text-sm font-medium truncate">
                    {team?.name ?? "—"}
                  </p>
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
            </CardContent>
          </Card>
        </section>

        {/* Déconnexion */}
        <section>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Disconnect
          </Button>
        </section>
      </div>
    </cap-page>
  )
}
