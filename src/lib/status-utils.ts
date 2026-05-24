function normalize(raw: string | undefined): string {
  return ((raw ?? "").split(":")[0] ?? "").toLowerCase()
}

export function statusDotColor(raw: string | undefined): string {
  const s = normalize(raw)
  if (s.startsWith("running")) return "bg-success"
  if (s.includes("exited") || s.includes("error") || s.includes("unhealthy")) return "bg-destructive"
  if (s.includes("starting") || s.includes("restarting") || s.includes("degraded")) return "bg-warning"
  return "bg-muted-foreground"
}

export function statusLabel(raw: string | undefined): string {
  const s = normalize(raw)
  if (s.startsWith("running")) return "Running"
  if (s.includes("exited")) return "Stopped"
  if (s.includes("starting")) return "Starting"
  if (s.includes("restarting")) return "Restarting"
  if (s.includes("error")) return "Error"
  if (s.includes("unhealthy")) return "Unhealthy"
  return s || "Unknown"
}

export function deploymentStatusColor(status: string): string {
  if (status === "finished") return "bg-success"
  if (status === "error" || status === "failed") return "bg-destructive"
  if (status === "in_progress") return "bg-warning"
  return "bg-muted-foreground"
}

export function firstDomain(fqdn: string): string {
  return (fqdn.split(",")[0] ?? "").trim().replace(/^https?:\/\//, "")
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.round(diffMs / 60_000)
  const diffHours = Math.round(diffMs / 3_600_000)
  const diffDays = Math.round(diffMs / 86_400_000)

  if (diffMin < 1) return rtf.format(0, "second")
  if (diffMin < 60) return rtf.format(-diffMin, "minute")
  if (diffHours < 24) return rtf.format(-diffHours, "hour")
  return rtf.format(-diffDays, "day")
}
