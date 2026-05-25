import { useState, useRef, useEffect } from "react"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { useServices, useStartService, useStopService, useRestartService } from "@/lib/api/services"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { Play, RotateCw, Square, Loader2 } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useDisplayedResourceStatus } from "@/lib/operation-tracker"
import { statusDotColor, statusLabel } from "@/lib/status-utils"
import { ErrorCard } from "@/components/error-card"

type ServiceSchema = components["schemas"]["Service"] & { status?: string }

type ContentProps = {
  services: ServiceSchema[] | undefined
  isPending: boolean
  isError: boolean
  refetch: () => void
  setSelected: (s: ServiceSchema) => void
}

function renderContent({ services, isPending, isError, refetch, setSelected }: ContentProps) {
  if (isError) return <ErrorCard onRetry={refetch} />
  if (isPending) return <ServicesSkeleton />
  if (services && services.length > 0) {
    return services.map((s) => (
      <ServiceCard key={s.uuid} service={s} onTap={() => setSelected(s)} />
    ))
  }
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">No services found</p>
      </CardContent>
    </Card>
  )
}

export default function Services() {
  const pageRef = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<ServiceSchema | null>(null)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: servicesRaw, isPending, isError, refetch } = useServices()
  const services = servicesRaw as ServiceSchema[] | undefined
  const selectedFromList = selected?.uuid
    ? services?.find((service) => service.uuid === selected.uuid)
    : undefined
  const displayedSelected = selectedFromList ?? selected
  const selectedStatus = useDisplayedResourceStatus("service", displayedSelected?.uuid, displayedSelected?.status)

  return (
    <>
      <cap-page ref={pageRef}>
        <div className="flex flex-col h-full">
          <Header title="Services" />
          <PullToRefresh onRefresh={refetch} className="flex-1 min-h-0">
            <div className="p-4 space-y-3 pb-(--safe-area-bottom)">
              {renderContent({ services, isPending, isError, refetch, setSelected })}
            </div>
          </PullToRefresh>
        </div>
      </cap-page>

      <Drawer open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{displayedSelected?.name ?? "Service"}</DrawerTitle>
            <DrawerDescription>
              <span className={cn("inline-block size-2 rounded-full mr-1.5 align-middle", statusDotColor(selectedStatus))} />
              {statusLabel(selectedStatus)}
              {displayedSelected?.service_type && ` · ${displayedSelected.service_type}`}
            </DrawerDescription>
          </DrawerHeader>
          {displayedSelected?.uuid && (
            <ServiceActions
              key={displayedSelected.uuid}
              uuid={displayedSelected.uuid}
              status={selectedStatus}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function ServiceCard({ service, onTap }: Readonly<{ service: ServiceSchema; onTap: () => void }>) {
  const status = useDisplayedResourceStatus("service", service.uuid, service.status)
  const rawStatus = ((status ?? "").split(":")[0] ?? "").toLowerCase()

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onTap}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-2 rounded-full shrink-0", statusDotColor(status))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{service.name ?? "Unnamed"}</p>
          {service.service_type && (
            <p className="text-xs text-muted-foreground truncate">{service.service_type}</p>
          )}
        </div>
        {rawStatus && (
          <p className="text-xs text-muted-foreground capitalize shrink-0">{rawStatus}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ServiceActions({ uuid, status }: Readonly<{ uuid: string; status?: string }>) {
  const { mutate: start, isPending: starting } = useStartService(uuid)
  const { mutate: stop, isPending: stopping } = useStopService(uuid)
  const { mutate: restart, isPending: restarting } = useRestartService(uuid)

  const s = ((status ?? "").split(":")[0] ?? "").toLowerCase()
  const isRunning = s.startsWith("running")
  const isStopped = !s || s === "stopped" || s.includes("exited")
  const isTransitioning = s.includes("starting") || s.includes("stopping") || s.includes("restarting")
  const isErrored = s.includes("error") || s.includes("unhealthy")
  const actionPending = starting || stopping || restarting

  if (isTransitioning) {
    return (
      <div className="flex items-center gap-2 px-4 pb-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="capitalize">{s}…</span>
      </div>
    )
  }

  return (
    <div className="flex gap-3 px-4 pb-6">
      {(isRunning || isErrored) && (
        <Button className="flex-1 gap-2 h-12 text-base" disabled={actionPending} onClick={() => restart()}>
          {restarting ? <Loader2 className="size-5 animate-spin" /> : <RotateCw className="size-5" />}
          Restart
        </Button>
      )}
      {(isStopped || isErrored) && (
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
