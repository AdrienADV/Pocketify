import { useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useApplication, useRestartApplication, useStartApplication, useStopApplication } from "@/lib/api/applications"
import { useApplicationDeployments } from "@/lib/api/deployments"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Square, Loader2, GitBranch, Globe, ExternalLink, ChevronRight } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { statusDotColor, statusLabel, deploymentStatusColor, firstDomain, timeAgo } from "@/lib/status-utils"
import { ErrorCard } from "@/components/error-card"

type DeploymentSchema = components["schemas"]["ApplicationDeploymentQueue"]

export default function ApplicationDetail() {
  const pageRef = useRef<HTMLElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: app, isPending: appPending, isError: appError, refetch: refetchApp } = useApplication(uuid)
  const { data: deploymentsRaw, isPending: deploymentsPending, isError: deploymentsError, refetch: refetchDeployments } = useApplicationDeployments(uuid)

  // API returns { count, deployments: [...] } but OpenAPI schema declares Application[] — waiting for Coolify fix
  const deployments = ((deploymentsRaw as unknown as { deployments?: DeploymentSchema[] })?.deployments) ?? []

  const handleRefresh = () => Promise.all([refetchApp(), refetchDeployments()])

  const status = app?.status?.toLowerCase() ?? ""
  const isRunning = status.startsWith("running")
  const isStopped = !status || status === "stopped" || status.includes("exited")
  const isTransitioning = status.includes("starting") || status.includes("restarting")
  const isError = status.includes("error") || status.includes("unhealthy")

  const { mutate: restart, isPending: restarting } = useRestartApplication(uuid!)
  const { mutate: start, isPending: starting } = useStartApplication(uuid!)
  const { mutate: stop, isPending: stopping } = useStopApplication(uuid!)

  const actionPending = restarting || starting || stopping

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title={app?.name ?? "Application"} />
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <div className="p-4 space-y-5 pb-(--safe-area-bottom)">

            {appError ? (
              <ErrorCard onRetry={() => void refetchApp()} />
            ) : (
              <>
                {/* Status */}
                <div className="flex items-center gap-2.5 py-2">
                  {appPending ? (
                    <>
                      <Skeleton className="size-3 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : (
                    <>
                      <div className={cn("size-3 rounded-full shrink-0", statusDotColor(status))} />
                      <p className="text-sm font-semibold">{statusLabel(status)}</p>
                      {app?.build_pack && (
                        <Badge variant="outline" className="text-[11px] capitalize ml-auto">{app.build_pack}</Badge>
                      )}
                    </>
                  )}
                </div>

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
                  <Card className="py-0">
                    <CardContent className="p-0 divide-y divide-border">
                      {app?.fqdn && (
                        <InfoRow
                          icon={Globe}
                          label="Domain"
                          value={firstDomain(app.fqdn)}
                          href={(app.fqdn.split(",")[0] ?? "").trim()}
                        />
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
              </>
            )}

            {/* Deployment history */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Recent Deployments
              </h2>
              {deploymentsError ? (
                <ErrorCard onRetry={() => void refetchDeployments()} />
              ) : deploymentsPending ? (
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
  href,
}: Readonly<{ icon: React.ElementType; label: string; value: string; href?: string }>) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
      {href && (
        <button
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground active:bg-muted shrink-0"
          onClick={() => window.open(href, "_system")}
        >
          <ExternalLink className="size-4" />
        </button>
      )}
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
    <Card className="py-0 cursor-pointer active:scale-[0.98] transition-transform" onClick={goToLogs}>
      <CardContent className="px-3 py-6 flex items-center gap-3">
        <div className={cn("size-2 rounded-full mt-1.5 shrink-0", deploymentStatusColor(deployment.status ?? ""))} />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-tight truncate">
            {deployment.commit_message ?? "No commit message"}
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
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

function InfoSkeleton() {
  return (
    <Card className="py-0">
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
        <Card key={i} className="py-0">
          <CardContent className="px-3 py-6 flex items-center gap-3">
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
