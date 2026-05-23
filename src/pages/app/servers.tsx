import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { $api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"

type ServerSchema = components["schemas"]["Server"]

function statusDotColor(reachable: boolean, usable: boolean) {
  if (reachable && usable) return "bg-success"
  if (reachable) return "bg-warning"
  return "bg-destructive"
}

export default function Servers() {
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: servers, isPending, refetch } = $api.useQuery("get", "/servers")

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title="Servers" />
        <PullToRefresh onRefresh={refetch} className="flex-1 min-h-0">
          <div className="p-4 space-y-3 pb-(--safe-area-bottom)">
            {isPending ? (
              <ServersSkeleton />
            ) : servers && servers.length > 0 ? (
              servers.map((s) => <ServerCard key={s.uuid} server={s} />)
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">No servers found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </PullToRefresh>
      </div>
    </cap-page>
  )
}

function ServerCard({ server }: Readonly<{ server: ServerSchema }>) {
  const navigate = useNavigate()
  const isReachable = server.settings?.is_reachable ?? false
  const isUsable = server.settings?.is_usable ?? false

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => {
      if (!server.uuid) return
      setDirection("forward")
      navigate(`/servers/${server.uuid}`)
    }}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-2 rounded-full shrink-0", statusDotColor(isReachable, isUsable))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{server.name ?? server.ip}</p>
          <p className="text-xs text-muted-foreground">{server.ip}</p>
        </div>
        {server.proxy_type && server.proxy_type !== "none" && (
          <Badge variant="outline" className="text-[11px] shrink-0 capitalize">{server.proxy_type}</Badge>
        )}
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

function ServersSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
