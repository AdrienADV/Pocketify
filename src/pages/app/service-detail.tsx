import { useRef, useEffect } from "react"
import { useParams } from "react-router"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { useMutation } from "@tanstack/react-query"
import { $api } from "@/lib/api"
import { fetchClient } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Square, Loader2 } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { toast } from "sonner"

type ServiceSchema = components["schemas"]["Service"] & { status?: string }
function parseStatus(status: string | undefined) {
  return (status ?? "").split(":")[0].toLowerCase()
}

function statusDotColor(status: string) {
  if (status.startsWith("running")) return "bg-success"
  if (status.includes("exited") || status.includes("error") || status.includes("unhealthy")) return "bg-destructive"
  if (status.includes("starting") || status.includes("restarting")) return "bg-warning"
  return "bg-muted-foreground"
}

function statusLabel(status: string) {
  if (status.startsWith("running")) return "Running"
  if (status.includes("exited")) return "Stopped"
  if (status.includes("starting")) return "Starting"
  if (status.includes("restarting")) return "Restarting"
  if (status.includes("error")) return "Error"
  if (status.includes("unhealthy")) return "Unhealthy"
  return status || "Unknown"
}

export default function ServiceDetail() {
  const pageRef = useRef<HTMLElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: serviceRaw, isPending: servicePending, refetch: refetchService } = $api.useQuery(
    "get", "/services/{uuid}",
    { params: { path: { uuid: uuid! } } },
  )
  const service = serviceRaw as ServiceSchema | undefined

  const handleRefresh = () => Promise.all([refetchService()])

  const status = parseStatus(service?.status)
  const isRunning = status.startsWith("running")
  const isStopped = !status || status === "stopped" || status.includes("exited")
  const isTransitioning = status.includes("starting") || status.includes("restarting")
  const isError = status.includes("error") || status.includes("unhealthy")

  const { mutate: restart, isPending: restarting } = useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/restart", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Restart queued"); void refetchService() },
    onError: () => toast.error("Failed to restart"),
  })

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/start", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Start requested"); void refetchService() },
    onError: () => toast.error("Failed to start"),
  })

  const { mutate: stop, isPending: stopping } = useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/stop", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Stop requested"); void refetchService() },
    onError: () => toast.error("Failed to stop"),
  })

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

