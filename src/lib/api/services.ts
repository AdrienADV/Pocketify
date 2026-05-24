import { useMutation, useQueryClient } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import { toast } from "sonner"

export const serviceKeys = {
  lists: ["get", "/services"] as const,
  details: ["get", "/services/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/services/{uuid}", { params: { path: { uuid } } }] as const,
}

export function useServices() {
  return $api.useQuery("get", "/services")
}

export function useService(uuid: string | undefined) {
  return $api.useQuery(
    "get", "/services/{uuid}",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid },
  )
}

export function useRestartService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/restart", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Restart queued")
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => toast.error("Failed to restart"),
  })
}

export function useStartService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/start", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Start requested")
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => toast.error("Failed to start"),
  })
}

export function useStopService(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/services/{uuid}/stop", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Stop requested")
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(uuid) })
    },
    onError: () => toast.error("Failed to stop"),
  })
}
