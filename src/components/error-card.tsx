import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ErrorCard({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <AlertCircle className="size-4 text-destructive shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">Failed to load</p>
        <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
      </CardContent>
    </Card>
  )
}
