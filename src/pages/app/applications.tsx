import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useMutation } from "@tanstack/react-query"
import { $api } from "@/lib/api"
import { fetchClient } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Loader2 } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { toast } from "sonner"

type ApplicationSchema = components["schemas"]["Application"]

function statusDotColor(status: string) {
  const s = status.toLowerCase()
  if (s.startsWith("running")) return "bg-success"
  if (s.includes("error") || s.includes("unhealthy") || s.includes("exited")) return "bg-destructive"
  if (s.includes("starting") || s.includes("restarting")) return "bg-warning"
  return "bg-muted-foreground"
}

function firstDomain(fqdn: string) {
  return fqdn.split(",")[0].trim().replace(/^https?:\/\//, "")
}

export default function Applications() {
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: apps, isPending, refetch } = $api.useQuery("get", "/applications")

  return (
    <cap-page ref={pageRef}>
      <Header title="Applications" />
      <PullToRefresh onRefresh={refetch}>
        <div className="p-4 space-y-3 pb-6">
          {isPending ? (
            <AppsSkeleton />
          ) : apps && apps.length > 0 ? (
            apps.map((app) => (
              <AppCard key={app.uuid} app={app} onRefresh={refetch} />
            ))
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </PullToRefresh>
    </cap-page>
  )
}

function AppCard({
  app,
  onRefresh,
}: Readonly<{ app: ApplicationSchema; onRefresh: () => void }>) {
  const navigate = useNavigate()
  const status = app.status?.toLowerCase() ?? ""
  const isRunning = status.startsWith("running")
  const isStopped = !status || status === "stopped" || status === "exited"
  const isTransitioning = status.includes("starting") || status.includes("restarting")
  const isError = status.includes("error") || status.includes("unhealthy")

  const { mutate: restart, isPending: restarting } = useMutation({
    mutationFn: () =>
      fetchClient.GET("/applications/{uuid}/restart", {
        params: { path: { uuid: app.uuid! } },
      }),
    onSuccess: () => { toast.success("Restart queued"); onRefresh() },
    onError: () => toast.error("Failed to restart"),
  })

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () =>
      fetchClient.GET("/applications/{uuid}/start", {
        params: { path: { uuid: app.uuid! } },
      }),
    onSuccess: () => { toast.success("Deployment queued"); onRefresh() },
    onError: () => toast.error("Failed to start"),
  })

  const actionPending = restarting || starting

  const goToDetail = () => {
    if (!app.uuid) return
    setDirection("forward")
    navigate(`/applications/${app.uuid}`)
  }

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={goToDetail}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("size-2 rounded-full mt-1.5 shrink-0", statusDotColor(status))} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="font-medium text-sm leading-tight truncate">
                {app.name ?? "Unnamed"}
              </p>
              {app.build_pack && (
                <Badge variant="outline" className="text-[11px] shrink-0 capitalize">
                  {app.build_pack}
                </Badge>
              )}
            </div>
            {app.fqdn ? (
              <p className="text-xs text-muted-foreground truncate">
                {firstDomain(app.fqdn)}
              </p>
            ) : app.git_repository ? (
              <p className="text-xs text-muted-foreground truncate">
                {app.git_repository}{app.git_branch ? ` · ${app.git_branch}` : ""}
              </p>
            ) : null}

            {!isTransitioning && app.uuid && (
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                {(isRunning || isError) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs gap-1.5"
                    disabled={actionPending}
                    onClick={() => restart()}
                  >
                    {restarting
                      ? <Loader2 className="size-3 animate-spin" />
                      : <RotateCw className="size-3" />
                    }
                    Restart
                  </Button>
                )}
                {(isStopped || isError) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs gap-1.5"
                    disabled={actionPending}
                    onClick={() => start()}
                  >
                    {starting
                      ? <Loader2 className="size-3 animate-spin" />
                      : <Play className="size-3" />
                    }
                    Deploy
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AppsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-start gap-3">
            <Skeleton className="size-2 rounded-full mt-1.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
