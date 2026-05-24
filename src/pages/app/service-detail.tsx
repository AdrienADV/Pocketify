import { useRef, useEffect } from "react"
import { useParams } from "react-router"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { useService, useRestartService, useStartService, useStopService } from "@/lib/api/services"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Square, Loader2 } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { statusDotColor, statusLabel } from "@/lib/status-utils"

type ServiceSchema = components["schemas"]["Service"] & { status?: string }

export default function ServiceDetail() {
  const pageRef = useRef<HTMLElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: service, isPending: servicePending, refetch: refetchService } = useService(uuid)

  const handleRefresh = refetchService

  const status = ((service as ServiceSchema | undefined)?.status ?? "").split(":")[0].toLowerCase()
  const isRunning = status.startsWith("running")
  const isStopped = !status || status === "stopped" || status.includes("exited")
  const isTransitioning = status.includes("starting") || status.includes("restarting")
  const isError = status.includes("error") || status.includes("unhealthy")

  const { mutate: restart, isPending: restarting } = useRestartService(uuid!)
  const { mutate: start, isPending: starting } = useStartService(uuid!)
  const { mutate: stop, isPending: stopping } = useStopService(uuid!)

  const actionPending = restarting || starting || stopping

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title={service?.name ?? "Service"} />
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <div className="p-4 space-y-5 pb-(--safe-area-bottom)">

            {/* Status */}
            <Card>
              <CardContent className="p-4">
                {servicePending ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className={cn("size-3 rounded-full shrink-0", statusDotColor(status))} />
                    <p className="text-sm font-semibold">{statusLabel(status)}</p>
                    {service?.service_type && (
                      <span className="text-[11px] text-muted-foreground capitalize ml-auto">{service.service_type}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {!isTransitioning && !servicePending && (
              <div className="flex gap-3">
                {(isRunning || isError) && (
                  <Button className="flex-1 gap-2 h-12 text-base" disabled={actionPending} onClick={() => restart()}>
                    {restarting ? <Loader2 className="size-5 animate-spin" /> : <RotateCw className="size-5" />}
                    Restart
                  </Button>
                )}
                {(isStopped || isError) && (
                  <Button className="flex-1 gap-2 h-12 text-base" disabled={actionPending} onClick={() => start()}>
                    {starting ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
                    Start
                  </Button>
                )}
                {isRunning && (
                  <Button variant="outline" className="flex-1 gap-2 h-12 text-base" disabled={actionPending} onClick={() => stop()}>
                    {stopping ? <Loader2 className="size-5 animate-spin" /> : <Square className="size-5" />}
                    Stop
                  </Button>
                )}
              </div>
            )}

          </div>
        </PullToRefresh>
      </div>
    </cap-page>
  )
}

