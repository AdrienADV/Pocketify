import { useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import { setupPage, setDirection } from "@capgo/capacitor-transitions/react"
import { useApplications } from "@/lib/api/applications"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { components } from "@/lib/api/v1"
import Header from "@/components/header"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useDisplayedResourceStatus } from "@/lib/operation-tracker"
import { statusDotColor, firstDomain } from "@/lib/status-utils"
import { ErrorCard } from "@/components/error-card"

type ApplicationSchema = components["schemas"]["Application"]

export default function Applications() {
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: apps, isPending, isError, refetch } = useApplications()

  return (
    <cap-page ref={pageRef}>
      <div className="flex flex-col h-full">
        <Header title="Applications" />
        <PullToRefresh onRefresh={refetch} className="flex-1 min-h-0">
          <div className="p-4 space-y-3 pb-(--safe-area-bottom)">
            {isError ? (
              <ErrorCard onRetry={() => void refetch()} />
            ) : isPending ? (
              <AppsSkeleton />
            ) : apps && apps.length > 0 ? (
              apps.map((app) => (
                <AppCard key={app.uuid} app={app} />
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
      </div>
    </cap-page>
  )
}

function AppCard({ app }: Readonly<{ app: ApplicationSchema }>) {
  const navigate = useNavigate()
  const status = useDisplayedResourceStatus("application", app.uuid, app.status)

  const goToDetail = () => {
    if (!app.uuid) return
    setDirection("forward")
    navigate(`/applications/${app.uuid}`)
  }

  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={goToDetail}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("size-2 rounded-full shrink-0", statusDotColor(status))} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-sm leading-tight truncate flex-1">
                {app.name ?? "Unnamed"}
              </p>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
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
