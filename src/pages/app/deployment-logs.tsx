import { useRef, useEffect } from "react"
import { useParams } from "react-router"
import { setupPage } from "@capgo/capacitor-transitions/react"
import { useDeployment, useCancelDeployment } from "@/lib/api/deployments"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { X, Loader2 } from "lucide-react"
import Header from "@/components/header"
import { timeAgo } from "@/lib/status-utils"

const ACTIVE_STATUSES = ["queued", "in_progress"]
const TERMINAL_STATUSES = ["finished", "error", "failed", "killed", "cancelled", "closed"]

function stripAnsi(str: string) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[mGKHF]/g, "").replace(/\r/g, "")
}

// Coolify logs are JSON: [{ command: string | null, output: string }]
function parseLogs(raw: string): string {
  try {
    const entries = JSON.parse(raw) as { command?: string | null; output?: string }[]
    return entries
      .map(({ command, output }) => {
        const lines: string[] = []
        if (command) lines.push(`$ ${command}`)
        if (output) lines.push(stripAnsi(output))
        return lines.join("\n")
      })
      .join("\n")
  } catch {
    return stripAnsi(raw)
  }
}

function statusBadge(status: string) {
  if (status === "in_progress") return <Badge className="bg-warning text-warning-foreground text-[11px]">Deploying</Badge>
  if (status === "queued") return <Badge variant="secondary" className="text-[11px]">Queued</Badge>
  if (status === "finished") return <Badge className="bg-success text-success-foreground text-[11px]">Done</Badge>
  if (status === "error" || status === "failed") return <Badge variant="destructive" className="text-[11px]">Failed</Badge>
  if (status === "cancelled") return <Badge variant="secondary" className="text-[11px]">Cancelled</Badge>
  if (status === "killed") return <Badge variant="destructive" className="text-[11px]">Killed</Badge>
  return <Badge variant="outline" className="text-[11px] capitalize">{status}</Badge>
}

export default function DeploymentLogs() {
  const pageRef = useRef<HTMLElement>(null)
  const logsRef = useRef<HTMLPreElement>(null)
  const { uuid } = useParams<{ uuid: string }>()

  useEffect(() => {
    if (pageRef.current) return setupPage(pageRef.current)
  }, [])

  const { data: deployment, isPending, isError, refetch } = useDeployment(uuid, {
    refetchInterval: (query: { state: { data?: { status?: string } } }) => {
      const status = query.state.data?.status ?? ""
      if (TERMINAL_STATUSES.includes(status)) return false
      return 2000
    },
  })

  const isActive = ACTIVE_STATUSES.includes(deployment?.status ?? "")
  const logs = deployment?.logs ? parseLogs(deployment.logs) : null

  useEffect(() => {
    if (isActive && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs, isActive])

  const { mutate: cancel, isPending: cancelling } = useCancelDeployment(uuid!)

  return (
    <cap-page ref={pageRef}>
      <Header title="Deployment Logs">
        {isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4"
            disabled={cancelling}
            onClick={() => cancel()}
          >
            {cancelling
              ? <Loader2 className="size-4 animate-spin" />
              : <X className="size-4" />
            }
          </Button>
        )}
      </Header>

      <div className="flex flex-col h-[calc(100%-3rem-env(safe-area-inset-top))]">

        {/* Meta */}
        <div className="px-4 py-3 border-b space-y-1 shrink-0">
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex-1">Failed to load deployment</p>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">
                  {deployment?.application_name ?? "Unknown app"}
                </p>
                {deployment?.status && statusBadge(deployment.status)}
                {isActive && <Loader2 className="size-3 text-muted-foreground animate-spin" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {deployment?.commit_message && (
                  <span className="truncate">{deployment.commit_message}</span>
                )}
                {deployment?.commit && (
                  <span className="font-mono shrink-0">{deployment.commit.slice(0, 7)}</span>
                )}
                {deployment?.created_at && (
                  <span className="shrink-0">{timeAgo(deployment.created_at)}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Logs */}
        <pre
          ref={logsRef}
          className={cn(
            "flex-1 overflow-y-auto p-4 text-[11px] leading-relaxed font-mono",
            "bg-black text-green-400 whitespace-pre-wrap wrap-break-word",
          )}
        >
          {isPending
            ? <span className="text-muted-foreground">Loading…</span>
            : isError
              ? <span className="text-destructive">Failed to load logs</span>
              : logs
                ? logs
                : <span className="text-muted-foreground">No logs available yet…</span>
          }
          {isActive && (
            <span className="inline-block w-2 h-3 bg-green-400 animate-pulse ml-0.5 align-middle" />
          )}
        </pre>
      </div>
    </cap-page>
  )
}
