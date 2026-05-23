import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { $api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Server, AppWindow, Package, ChevronRight, Loader2 } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"

type DeploymentSchema = components["schemas"]["ApplicationDeploymentQueue"]

export default function Home() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team, refetch: refetchTeam } = $api.useQuery("get", "/teams/current")
  const { data: servers, isPending: serversPending, refetch: refetchServers } = $api.useQuery("get", "/servers")
  const { data: apps, isPending: appsPending, refetch: refetchApps } = $api.useQuery("get", "/applications")
  const { data: servicesRaw, isPending: servicesPending, refetch: refetchServices } = $api.useQuery("get", "/services")
  const { data: deployments, isPending: deploymentsPending, refetch: refetchDeployments } = $api.useQuery(
    "get", "/deployments",
    {},
    {
      refetchInterval: (query) => {
        const data = query.state.data
        if (!data || data.length === 0) return false
        return data.some((d) => d.status === "in_progress" || d.status === "queued") ? 3000 : false
      },
    },
  )

  const hasActiveDeployments = deployments && deployments.length > 0

  const handleRefresh = () =>
    Promise.all([refetchTeam(), refetchServers(), refetchApps(), refetchServices(), refetchDeployments()])

  const go = (path: string) => {
    setDirection("forward")
    navigate(path)
  }

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title="Dashboard" showBack={false} />
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <div className="p-4 space-y-4 pb-(--safe-area-bottom)">

            {/* Team indicator */}
            <TeamIndicator name={team?.name} />

            {/* Déploiements actifs — uniquement si en cours */}
            {(deploymentsPending || hasActiveDeployments) && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Deployments
                  </h2>
                  {hasActiveDeployments && (
                    <Loader2 className="size-3 text-muted-foreground animate-spin" />
                  )}
                </div>
                {deploymentsPending ? (
                  <DeploymentsSkeleton />
                ) : (
                  deployments!.map((d) => (
                    <DeploymentCard key={d.deployment_uuid} deployment={d} />
                  ))
                )}
              </section>
            )}

            {/* Catégories */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Resources
              </h2>

              <ResourceCard
                icon={AppWindow}
                label="Applications"
                isPending={appsPending}
                total={apps?.length ?? 0}
                activeCount={apps?.filter((a) => a.status?.toLowerCase().startsWith("running")).length ?? 0}
                activeLabel="running"
                onClick={() => go("/applications")}
              />

              <ResourceCard
                icon={Package}
                label="Services"
                isPending={servicesPending}
                total={(servicesRaw as unknown[])?.length ?? 0}
                onClick={() => go("/services")}
              />

              <ResourceCard
                icon={Server}
                label="Servers"
                isPending={serversPending}
                total={servers?.length ?? 0}
                activeCount={servers?.filter((s) => s.settings?.is_reachable && s.settings?.is_usable).length ?? 0}
                activeLabel="online"
                onClick={() => go("/servers")}
              />

            </section>
          </div>
        </PullToRefresh>
      </div>
    </cap-page>
  )
}

/* ── Team indicator ── */

function TeamIndicator({ name }: Readonly<{ name: string | undefined }>) {
  return (
    <div className="flex items-center h-11 px-3.5 rounded-xl border border-input bg-background">
      {name
        ? <span className="text-sm font-medium truncate">{name}</span>
        : <Skeleton className="h-4 w-32" />
      }
    </div>
  )
}

/* ── Resource card ── */

function ResourceCard({
  icon: Icon,
  label,
  isPending,
  total,
  activeCount,
  activeLabel,
  onClick,
}: Readonly<{
  icon: React.ElementType
  label: string
  isPending: boolean
  total: number
  activeCount?: number
  activeLabel?: string
  onClick: () => void
}>) {
  const sublabel = isPending
    ? null
    : activeCount !== undefined
      ? `${activeCount} ${activeLabel} · ${total} total`
      : `${total} total`

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{label}</p>
          {sublabel === null
            ? <Skeleton className="h-3 w-28 mt-1" />
            : <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          }
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

/* ── Deployment card ── */

function DeploymentCard({ deployment }: Readonly<{ deployment: DeploymentSchema }>) {
  const navigate = useNavigate()

  const goToLogs = () => {
    if (!deployment.deployment_uuid) return
    setDirection("forward")
    navigate(`/deployments/${deployment.deployment_uuid}`)
  }

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={goToLogs}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight flex-1 min-w-0 truncate">
            {deployment.application_name ?? "Unknown app"}
          </p>
          <DeploymentStatusBadge status={deployment.status ?? ""} />
        </div>
        {deployment.commit_message && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{deployment.commit_message}</p>
        )}
        {deployment.server_name && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">{deployment.server_name}</p>
        )}
      </CardContent>
    </Card>
  )
}

function DeploymentStatusBadge({ status }: Readonly<{ status: string }>) {
  if (status === "in_progress") return <Badge className="bg-warning text-warning-foreground shrink-0 text-[11px]">Deploying</Badge>
  if (status === "queued") return <Badge variant="secondary" className="shrink-0 text-[11px]">Queued</Badge>
  if (status === "failed") return <Badge variant="destructive" className="shrink-0 text-[11px]">Failed</Badge>
  return <Badge variant="outline" className="shrink-0 text-[11px] capitalize">{status}</Badge>
}

/* ── Skeletons ── */

function DeploymentsSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
