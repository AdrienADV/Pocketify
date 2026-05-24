import { useRef, useEffect } from "react"
import { useParams } from "react-router"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { useServer, useServerResources } from "@/lib/api/servers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Cpu, Globe, Network, User } from "lucide-react"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { statusDotColor } from "@/lib/status-utils"
import { ErrorCard } from "@/components/error-card"

type Resource = {
  id?: number
  uuid?: string
  name?: string
  type?: string
  status?: string
}

function resourceTypeLabel(type: string | undefined) {
  if (!type) return null
  const t = type.toLowerCase()
  if (t.includes("application")) return "App"
  if (t.includes("service")) return "Service"
  if (t.includes("postgres")) return "PostgreSQL"
  if (t.includes("mysql")) return "MySQL"
  if (t.includes("mariadb")) return "MariaDB"
  if (t.includes("redis")) return "Redis"
  if (t.includes("mongo")) return "MongoDB"
  if (t.includes("clickhouse")) return "Clickhouse"
  if (t.includes("dragonfly")) return "Dragonfly"
  if (t.includes("keydb")) return "KeyDB"
  return type.replace(/^Standalone/, "").replace(/^App\\Models\\/, "")
}

export default function ServerDetail() {
  const pageRef = useRef<HTMLElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: server, isPending: serverPending, isError: serverError, refetch: refetchServer } = useServer(uuid)
  const { data: resources, isPending: resourcesPending, isError: resourcesError, refetch: refetchResources } = useServerResources(uuid)

  const handleRefresh = () => Promise.all([refetchServer(), refetchResources()])

  const isReachable = server?.settings?.is_reachable ?? false
  const isUsable = server?.settings?.is_usable ?? false

  const statusColor = isReachable && isUsable
    ? "bg-success"
    : isReachable
      ? "bg-warning"
      : "bg-destructive"

  const statusLabel = isReachable && isUsable
    ? "Online"
    : isReachable
      ? "Reachable — not usable"
      : "Unreachable"

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title={server?.name ?? "Server"} />
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
        <div className="p-4 space-y-5 pb-(--safe-area-bottom)">

          {serverError ? (
            <ErrorCard onRetry={() => void refetchServer()} />
          ) : (
            <>
              {/* Status */}
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  {serverPending ? (
                    <>
                      <Skeleton className="size-3 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                    </>
                  ) : (
                    <>
                      <div className={cn("size-3 rounded-full shrink-0", statusColor)} />
                      <p className="text-sm font-semibold">{statusLabel}</p>
                      {server?.proxy_type && server.proxy_type !== "none" && (
                        <Badge variant="outline" className="text-[11px] capitalize ml-auto">
                          {server.proxy_type}
                        </Badge>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Info */}
              {serverPending ? (
                <InfoSkeleton />
              ) : (
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {server?.ip && (
                      <InfoRow icon={Globe} label="IP Address" value={server.ip} />
                    )}
                    {server?.user && (
                      <InfoRow
                        icon={User}
                        label="SSH"
                        value={`${server.user}@${server.ip ?? ""}${server.port ? `:${server.port}` : ""}`}
                      />
                    )}
                    {server?.settings?.wildcard_domain && (
                      <InfoRow icon={Network} label="Wildcard Domain" value={server.settings.wildcard_domain} />
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Resources */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Resources
            </h2>
            {resourcesError ? (
              <ErrorCard onRetry={() => void refetchResources()} />
            ) : resourcesPending ? (
              <ResourcesSkeleton />
            ) : resources && resources.length > 0 ? (
              (resources as Resource[]).map((r) => (
                <ResourceCard key={r.uuid ?? r.id} resource={r} />
              ))
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">No resources on this server</p>
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
        <p className="text-sm font-mono truncate">{value}</p>
      </div>
    </div>
  )
}

function ResourceCard({ resource }: Readonly<{ resource: Resource }>) {
  const typeLabel = resourceTypeLabel(resource.type)
  const statusKey = (resource.status ?? "").split(":")[0]

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-2.5 rounded-full shrink-0", statusDotColor(resource.status))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{resource.name ?? "Unnamed"}</p>
          {statusKey && (
            <p className="text-xs text-muted-foreground capitalize">{statusKey}</p>
          )}
        </div>
        {typeLabel && (
          <Badge variant="outline" className="text-[11px] shrink-0">
            {typeLabel}
          </Badge>
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
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ResourcesSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="size-2.5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
