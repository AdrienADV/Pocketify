import { useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { $api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Server, AppWindow, Rocket, ChevronRight } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"

type ServerSchema = components["schemas"]["Server"]
type DeploymentSchema = components["schemas"]["ApplicationDeploymentQueue"]

function plural(count: number, word: string) {
  return `${count} ${word}${count !== 1 ? "s" : ""}`
}

function serverStatusColor(isReachable: boolean, isUsable: boolean) {
  if (isReachable && isUsable) return "bg-success"
  if (isReachable) return "bg-warning"
  return "bg-destructive"
}

export default function Home() {
  const pageRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: team, error: teamError, refetch: refetchTeam } = $api.useQuery("get", "/teams/current")
  const { data: servers, isPending: serversPending, error: serversError, refetch: refetchServers } = $api.useQuery("get", "/servers")
  const { data: apps, isPending: appsPending, error: appsError, refetch: refetchApps } = $api.useQuery("get", "/applications")
  const { data: deployments, isPending: deploymentsPending, error: deploymentsError, refetch: refetchDeployments } = $api.useQuery("get", "/deployments")

  const stats = useMemo(() => ({
    serversTotal: servers?.length ?? 0,
    serversOnline: servers?.filter((s) => s.settings?.is_reachable).length ?? 0,
    appsTotal: apps?.length ?? 0,
    appsRunning: apps?.filter((a) => a.status?.toLowerCase().startsWith("running")).length ?? 0,
    deploymentsActive: deployments?.length ?? 0,
  }), [servers, apps, deployments])

  const isLoading = serversPending || appsPending || deploymentsPending

  const serverSublabel = isLoading ? null : plural(stats.serversTotal, "server")
  const appSublabel = isLoading ? null : plural(stats.appsTotal, "app")

  const handleRefresh = () =>
    Promise.all([refetchTeam(), refetchServers(), refetchApps(), refetchDeployments()])

  const goToApplications = () => {
    setDirection("forward")
    navigate("/applications")
  }

  return (
    <cap-page ref={pageRef}>
      <Header title={team?.name ?? "Coolify"} showBack={false} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-6 pb-6">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Server} value={isLoading ? null : stats.serversOnline} label="Online" sublabel={serverSublabel} />
            <StatCard icon={AppWindow} value={isLoading ? null : stats.appsRunning} label="Running" sublabel={appSublabel} onClick={goToApplications} />
            <StatCard icon={Rocket} value={isLoading ? null : stats.deploymentsActive} label="Deploying" sublabel={isLoading ? null : "active"} />
          </div>

          <section className="space-y-2">
            <SectionTitle>Active Deployments</SectionTitle>
            <DeploymentsContent deployments={deployments} isPending={deploymentsPending} />
          </section>

          <section className="space-y-2">
            <SectionTitle>Servers</SectionTitle>
            <ServersContent servers={servers} isPending={serversPending} />
          </section>
        </div>
      </PullToRefresh>
    </cap-page>
  )
}

/* ── Sections ── */

function DeploymentsContent({
  deployments,
  isPending,
}: Readonly<{ deployments: DeploymentSchema[] | undefined; isPending: boolean }>) {
  if (isPending) return <DeploymentsSkeleton />
  if (deployments && deployments.length > 0) {
    return deployments.map((d) => <DeploymentCard key={d.deployment_uuid} deployment={d} />)
  }
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-2.5">
        <div className="size-2 rounded-full bg-success shrink-0" />
        <p className="text-sm text-muted-foreground">All systems operational</p>
      </CardContent>
    </Card>
  )
}

function ServersContent({
  servers,
  isPending,
}: Readonly<{ servers: ServerSchema[] | undefined; isPending: boolean }>) {
  if (isPending) return <ServersSkeleton />
  if (servers && servers.length > 0) {
    return servers.map((s) => <ServerCard key={s.uuid} server={s} />)
  }
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">No servers configured</p>
      </CardContent>
    </Card>
  )
}

/* ── Composants ── */

function SectionTitle({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
      {children}
    </h2>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  onClick,
}: Readonly<{
  icon: React.ElementType
  value: number | null
  label: string
  sublabel: string | null
  onClick?: () => void
}>) {
  return (
    <Card className={onClick ? "cursor-pointer active:scale-[0.97] transition-transform" : undefined} onClick={onClick}>
      <CardContent className="p-3 flex flex-col items-center text-center gap-1">
        <Icon className="size-4 text-muted-foreground" />
        {value === null
          ? <Skeleton className="h-6 w-8 mt-0.5" />
          : <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        }
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        {sublabel === null
          ? <Skeleton className="h-3 w-10" />
          : <p className="text-[10px] text-muted-foreground/60 leading-tight">{sublabel}</p>
        }
        {onClick && <ChevronRight className="size-3 text-muted-foreground/40 mt-0.5" />}
      </CardContent>
    </Card>
  )
}

function DeploymentCard({ deployment }: Readonly<{ deployment: DeploymentSchema }>) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight flex-1 min-w-0 truncate">
            {deployment.application_name ?? "Unknown app"}
          </p>
          <DeploymentStatusBadge status={deployment.status ?? ""} />
        </div>
        {deployment.commit_message && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {deployment.commit_message}
          </p>
        )}
        {deployment.server_name && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {deployment.server_name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DeploymentStatusBadge({ status }: Readonly<{ status: string }>) {
  if (status === "in_progress") {
    return <Badge className="bg-warning text-warning-foreground shrink-0 text-[11px]">Deploying</Badge>
  }
  if (status === "queued") {
    return <Badge variant="secondary" className="shrink-0 text-[11px]">Queued</Badge>
  }
  if (status === "failed") {
    return <Badge variant="destructive" className="shrink-0 text-[11px]">Failed</Badge>
  }
  return <Badge variant="outline" className="shrink-0 text-[11px] capitalize">{status}</Badge>
}

function ServerCard({ server }: Readonly<{ server: ServerSchema }>) {
  const navigate = useNavigate()
  const isReachable = server.settings?.is_reachable ?? false
  const isUsable = server.settings?.is_usable ?? false

  const goToDetail = () => {
    if (!server.uuid) return
    setDirection("forward")
    navigate(`/servers/${server.uuid}`)
  }

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={goToDetail}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-2.5 rounded-full shrink-0", serverStatusColor(isReachable, isUsable))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{server.name ?? server.ip}</p>
          <p className="text-xs text-muted-foreground">{server.ip}</p>
        </div>
        {server.proxy_type && server.proxy_type !== "none" && (
          <Badge variant="outline" className="text-[11px] shrink-0 capitalize">
            {server.proxy_type}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

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

function ServersSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="size-2.5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
