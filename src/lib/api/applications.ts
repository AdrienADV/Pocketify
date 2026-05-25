import { useMutation, useQueryClient } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import { deploymentKeys } from "@/lib/api/deployments"
import {
  clearResourceOperation,
  trackResourceOperation,
  useHasActiveResourceOperations,
  useResourceOperation,
} from "@/lib/operation-tracker"
import { toast } from "sonner"

export const applicationKeys = {
  lists: ["get", "/applications"] as const,
  details: ["get", "/applications/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/applications/{uuid}", { params: { path: { uuid } } }] as const,
}

export function useApplications() {
  const hasActiveOperations = useHasActiveResourceOperations("application")

  return $api.useQuery("get", "/applications", {}, {
    refetchInterval: hasActiveOperations ? 2000 : false,
  })
}

export function useApplication(uuid: string | undefined) {
  const operation = useResourceOperation("application", uuid)

  return $api.useQuery(
    "get", "/applications/{uuid}",
    { params: { path: { uuid: uuid! } } },
    {
      enabled: !!uuid,
      refetchInterval: operation ? 2000 : false,
    },
  )
}

export function useRestartApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("application", uuid, "restart"),
    mutationFn: () => fetchClient.GET("/applications/{uuid}/restart", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Restart queued")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists })
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => {
      clearResourceOperation("application", uuid)
      toast.error("Failed to restart")
    },
  })
}

export function useStartApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("application", uuid, "start"),
    mutationFn: () => fetchClient.GET("/applications/{uuid}/start", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Deployment queued")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists })
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => {
      clearResourceOperation("application", uuid)
      toast.error("Failed to start")
    },
  })
}

export function useStopApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("application", uuid, "stop"),
    mutationFn: () => fetchClient.GET("/applications/{uuid}/stop", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Stop requested")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists })
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => {
      clearResourceOperation("application", uuid)
      toast.error("Failed to stop")
    },
  })
}
