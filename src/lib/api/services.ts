import { useMutation, useQueryClient } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import {
  clearResourceOperation,
  trackResourceOperation,
  useHasActiveResourceOperations,
  useResourceOperation,
} from "@/lib/operation-tracker"
import { toast } from "sonner"

export const serviceKeys = {
  lists: ["get", "/services"] as const,
  details: ["get", "/services/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/services/{uuid}", { params: { path: { uuid } } }] as const,
}

export function useServices() {
  const hasActiveOperations = useHasActiveResourceOperations("service")

  return $api.useQuery("get", "/services", {}, {
    refetchInterval: hasActiveOperations ? 2000 : false,
  })
}

export function useService(uuid: string | undefined) {
  const operation = useResourceOperation("service", uuid)

  return $api.useQuery(
    "get", "/services/{uuid}",
    { params: { path: { uuid: uuid! } } },
    {
      enabled: !!uuid,
      refetchInterval: operation ? 2000 : false,
    },
  )
}

export function useRestartService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("service", uuid, "restart"),
    mutationFn: () => fetchClient.GET("/services/{uuid}/restart", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists })
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("service", uuid)
      toast.error("Failed to restart")
    },
  })
}

export function useStartService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("service", uuid, "start"),
    mutationFn: () => fetchClient.GET("/services/{uuid}/start", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists })
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("service", uuid)
      toast.error("Failed to start")
    },
  })
}

export function useStopService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: () => trackResourceOperation("service", uuid, "stop"),
    mutationFn: () => fetchClient.GET("/services/{uuid}/stop", { params: { path: { uuid } } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists })
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => {
      clearResourceOperation("service", uuid)
      toast.error("Failed to stop")
    },
  })
}
