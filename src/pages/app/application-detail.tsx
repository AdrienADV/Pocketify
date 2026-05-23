import { useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useMutation } from "@tanstack/react-query"
import { $api } from "@/lib/api"
import { fetchClient } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Square, Loader2, GitBranch, Globe } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { toast } from "sonner"

type DeploymentSchema = components["schemas"]["ApplicationDeploymentQueue"]

function statusDotColor(status: string) {
  const s = status.toLowerCase()
  if (s.startsWith("running")) return "bg-success"
  if (s.includes("error") || s.includes("unhealthy") || s.includes("exited")) return "bg-destructive"
  if (s.includes("starting") || s.includes("restarting")) return "bg-warning"
  return "bg-muted-foreground"
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s.startsWith("running")) return "Running"
  if (s.includes("exited")) return "Stopped"
  if (s.includes("starting")) return "Starting"
  if (s.includes("restarting")) return "Restarting"
  if (s.includes("error")) return "Error"
  if (s.includes("unhealthy")) return "Unhealthy"
  return status || "Unknown"
}

function firstDomain(fqdn: string) {
  return fqdn.split(",")[0].trim().replace(/^https?:\/\//, "")
}

function deploymentStatusColor(status: string) {
  if (status === "finished") return "bg-success"
  if (status === "error" || status === "failed") return "bg-destructive"
  if (status === "in_progress") return "bg-warning"
  if (status === "queued") return "bg-muted-foreground"
  return "bg-muted-foreground"
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ApplicationDetail() {
  const pageRef = useRef<HTMLElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: app, isPending: appPending, refetch: refetchApp } = $api.useQuery(
    "get", "/applications/{uuid}",
    { params: { path: { uuid: uuid! } } },
  )

  const { data: deploymentsRaw, isPending: deploymentsPending, refetch: refetchDeployments } = $api.useQuery(
    "get", "/deployments/applications/{uuid}",
    { params: { path: { uuid: uuid! }, query: { take: 10 } } },
  )

  // L'API retourne { count, deployments: [...] } mais le schema OpenAPI déclare Application[]
  const deployments = ((deploymentsRaw as unknown as { deployments?: DeploymentSchema[] })?.deployments) ?? []

  const handleRefresh = () => Promise.all([refetchApp(), refetchDeployments()])

  const status = app?.status?.toLowerCase() ?? ""
  const isRunning = status.startsWith("running")
  const isStopped = !status || status === "stopped" || status.includes("exited")
  const isTransitioning = status.includes("starting") || status.includes("restarting")
  const isError = status.includes("error") || status.includes("unhealthy")

  const { mutate: restart, isPending: restarting } = useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/restart", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Restart queued"); void refetchApp() },
    onError: () => toast.error("Failed to restart"),
  })

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/start", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Deployment queued"); void refetchApp() },
    onError: () => toast.error("Failed to start"),
  })

  const { mutate: stop, isPending: stopping } = useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/stop", { params: { path: { uuid: uuid! } } }),
    onSuccess: () => { toast.success("Stop requested"); void refetchApp() },
    onError: () => toast.error("Failed to stop"),
  })

  const actionPending = restarting || starting || stopping

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
      <Header title={app?.name ?? "Application"} />
      <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
        <div className="p-4 space-y-5 pb-(--safe-area-bottom)">

          {/* Status */}
          <Card>
            <CardContent className="p-4">
              {appPending ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className={cn("size-3 rounded-full shrink-0", statusDotColor(status))} />
                  <p className="text-sm font-semibold">{statusLabel(status)}</p>
                  {app?.build_pack && (
                    <Badge variant="outline" className="text-[11px] capitalize ml-auto">{app.build_pack}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isTransitioning && !appPending && (
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
                  Deploy
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

          {/* Info */}
          {appPending ? (
            <InfoSkeleton />
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {app?.fqdn && (
                  <InfoRow icon={Globe} label="Domain" value={firstDomain(app.fqdn)} />
                )}
                {app?.git_repository && (
                  <InfoRow
                    icon={GitBranch}
                    label="Repository"
                    value={`${app.git_repository}${app.git_branch ? ` · ${app.git_branch}` : ""}`}
                  />
                )}
                {app?.description && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                    <p className="text-sm">{app.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deployment history */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Recent Deployments
            </h2>
            {deploymentsPending ? (
              <DeploymentsSkeleton />
            ) : deployments.length > 0 ? (
              deployments.map((d) => (
                <DeploymentRow key={d.deployment_uuid} deployment={d} />
              ))
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">No deployments yet</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </PullToRefresh>
      </div>
    </cap-page>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: React.ElementType; label: string; value: string }>) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

function DeploymentRow({ deployment }: Readonly<{ deployment: DeploymentSchema }>) {
  const navigate = useNavigate()

  const goToLogs = () => {
    if (!deployment.deployment_uuid) return
    setDirection("forward")
    navigate(`/deployments/${deployment.deployment_uuid}`)
  }

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={goToLogs}>
      <CardContent className="p-3 flex items-start gap-3">
        <div className={cn("size-2 rounded-full mt-1.5 shrink-0", deploymentStatusColor(deployment.status ?? ""))} />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-tight truncate">
            {deployment.commit_message ?? "Manual deployment"}
          </p>
          {deployment.commit && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {deployment.commit.slice(0, 7)}
            </p>
          )}
        </div>
        {deployment.created_at && (
          <p className="text-xs text-muted-foreground/60 shrink-0">{timeAgo(deployment.created_at)}</p>
        )}
      </CardContent>
    </Card>
  )
}

function InfoSkeleton() {
  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="size-4 mt-0.5" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DeploymentsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-start gap-3">
            <Skeleton className="size-2 rounded-full mt-1.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-10" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
