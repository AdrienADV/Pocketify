import { useEffect, useRef } from "react"
import { useParams } from "react-router"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { Loader2 } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApplication, useApplicationRuntimeLogs } from "@/lib/api/applications"
import { cn } from "@/lib/utils"
import { statusLabel } from "@/lib/status-utils"

function stripAnsi(str: string) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[mGKHF]/g, "").replace(/\r/g, "")
}

function normalizedStatus(status: string | undefined) {
  return ((status ?? "").split(":")[0] ?? "").toLowerCase()
}

export default function ApplicationRuntimeLogs() {
  const pageRef = useRef<HTMLElement>(null)
  const logsRef = useRef<HTMLPreElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: app, isPending: appPending, isError: appError, refetch: refetchApp } = useApplication(uuid)
  const status = normalizedStatus(app?.status)
  const isRunning = status.startsWith("running")

  const {
    data,
    isPending: logsPending,
    isError: logsError,
  } = useApplicationRuntimeLogs(uuid, 300, isRunning)

  const logs = data?.logs ? stripAnsi(data.logs) : null

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  return (
    <cap-page ref={pageRef}>
      <Header title="Runtime Logs" />

      <div className="flex flex-col h-[calc(100%-3rem-env(safe-area-inset-top))]">
        <div className="px-4 py-3 border-b space-y-1 shrink-0">
          {appPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : appError ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex-1">Failed to load application</p>
              <Button variant="ghost" size="sm" onClick={() => void refetchApp()}>Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{app?.name ?? "Application"}</p>
                {isRunning && <Loader2 className="size-3 text-muted-foreground animate-spin" />}
              </div>
              <p className="text-xs text-muted-foreground">{statusLabel(status)}</p>
            </>
          )}
        </div>

        <pre
          ref={logsRef}
          className={cn(
            "flex-1 overflow-y-auto p-4 text-[11px] leading-relaxed font-mono",
            "bg-black text-green-400 whitespace-pre-wrap wrap-break-word",
          )}
        >
          {appPending
            ? <span className="text-muted-foreground">Loading application...</span>
            : !isRunning
              ? <span className="text-muted-foreground">Application is not running.</span>
              : logsPending
                ? <span className="text-muted-foreground">Loading logs...</span>
                : logsError
                  ? <span className="text-destructive">Runtime logs unavailable.</span>
                  : logs
                    ? logs
                    : <span className="text-muted-foreground">No runtime logs available yet...</span>
          }
          {isRunning && !logsError && (
            <span className="inline-block w-2 h-3 bg-green-400 animate-pulse ml-0.5 align-middle" />
          )}
        </pre>
      </div>
    </cap-page>
  )
}
