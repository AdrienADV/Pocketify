import { useMutation, useQueryClient } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import {
  clearResourceOperation,
  trackResourceOperation,
  useHasActiveResourceOperations,
  useResourceOperation,
} from "@/lib/operation-tracker"
import { toast } from "sonner"

// Types locaux — en attente de correction côté Coolify (OpenAPI génère `string` pour ces endpoints)
export type Database = {
  uuid?: string
  name?: string
  description?: string
  status?: string
  type?: string
  image?: string
}

export type DatabaseBackup = {
  uuid?: string
  enabled?: boolean
  frequency?: string
  status?: string
  created_at?: string
}

export const databaseKeys = {
  lists: ["get", "/databases"] as const,
  detail: (uuid: string) =>
    ["get", "/databases/{uuid}", { params: { path: { uuid } } }] as const,
  backups: (uuid: string) =>
    ["get", "/databases/{uuid}/backups", { params: { path: { uuid } } }] as const,
}

export function useDatabases() {
  const hasActiveOperations = useHasActiveResourceOperations("database")
  const q = $api.useQuery("get", "/databases", {}, {
    refetchInterval: hasActiveOperations ? 2000 : false,
  })
  return { ...q, data: q.data as unknown as Database[] | undefined } // waiting for Coolify correction
}

export function useDatabase(uuid: string | undefined) {
  const operation = useResourceOperation("database", uuid)
  const q = $api.useQuery(
    "get",
    "/databases/{uuid}",
    { params: { path: { uuid: uuid! } } },
    {
      enabled: !!uuid,
      refetchInterval: operation ? 2000 : false,
    },
  )
  return { ...q, data: q.data as Database | undefined }
}

export function useDatabaseBackups(uuid: string | undefined) {
  const q = $api.useQuery(
    "get",
    "/databases/{uuid}/backups",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid },
  )
  return { ...q, data: q.data as DatabaseBackup[] | undefined }
}

export function useStartDatabase(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("database", uuid, "start"),
    mutationFn: () =>
      fetchClient.GET("/databases/{uuid}/start", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: databaseKeys.lists })
      void queryClient.invalidateQueries({ queryKey: databaseKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("database", uuid)
      toast.error("Failed to start")
    },
  })
}

export function useStopDatabase(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("database", uuid, "stop"),
    mutationFn: () =>
      fetchClient.GET("/databases/{uuid}/stop", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: databaseKeys.lists })
      void queryClient.invalidateQueries({ queryKey: databaseKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("database", uuid)
      toast.error("Failed to stop")
    },
  })
}

export function useRestartDatabase(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("database", uuid, "restart"),
    mutationFn: () =>
      fetchClient.GET("/databases/{uuid}/restart", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: databaseKeys.lists })
      void queryClient.invalidateQueries({ queryKey: databaseKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("database", uuid)
      toast.error("Failed to restart")
    },
  })
}

export function dbTypeLabel(db: Database): string {
  const src = (db.type ?? db.image ?? "").toLowerCase()
  if (src.includes("postgres")) return "PostgreSQL"
  if (src.includes("mysql")) return "MySQL"
  if (src.includes("mariadb")) return "MariaDB"
  if (src.includes("mongo")) return "MongoDB"
  if (src.includes("redis")) return "Redis"
  if (src.includes("keydb")) return "KeyDB"
  if (src.includes("dragonfly")) return "DragonFly"
  if (src.includes("clickhouse")) return "ClickHouse"
  return src || "Database"
}
