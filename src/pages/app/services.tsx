import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useServices } from "@/lib/api/services"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { statusDotColor } from "@/lib/status-utils"
import { ErrorCard } from "@/components/error-card"

type ServiceSchema = components["schemas"]["Service"] & { status?: string }

export default function Services() {
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: servicesRaw, isPending, isError, refetch } = useServices()
  const services = servicesRaw as ServiceSchema[] | undefined

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title="Services" />
        <PullToRefresh onRefresh={refetch} className="flex-1 min-h-0">
          <div className="p-4 space-y-3 pb-(--safe-area-bottom)">
            {isError ? (
              <ErrorCard onRetry={() => void refetch()} />
            ) : isPending ? (
              <ServicesSkeleton />
            ) : services && services.length > 0 ? (
              services.map((s) => <ServiceCard key={s.uuid} service={s} />)
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">No services found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </PullToRefresh>
      </div>
    </cap-page>
  )
}

function ServiceCard({ service }: Readonly<{ service: ServiceSchema }>) {
  const navigate = useNavigate()
  const rawStatus = ((service.status ?? "").split(":")[0] ?? "").toLowerCase()

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => {
      if (!service.uuid) return
      setDirection("forward")
      navigate(`/services/${service.uuid}`)
    }}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-2 rounded-full shrink-0", statusDotColor(service.status))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{service.name ?? "Unnamed"}</p>
          {service.service_type && (
            <p className="text-xs text-muted-foreground truncate">{service.service_type}</p>
          )}
        </div>
        {rawStatus && (
          <p className="text-xs text-muted-foreground capitalize shrink-0">{rawStatus}</p>
        )}
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

function ServicesSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-14" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
