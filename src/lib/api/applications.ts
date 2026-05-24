import { useMutation, useQueryClient } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import { deploymentKeys } from "@/lib/api/deployments"
import { toast } from "sonner"

export const applicationKeys = {
  lists: ["get", "/applications"] as const,
  details: ["get", "/applications/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/applications/{uuid}", { params: { path: { uuid } } }] as const,
}

export function useApplications() {
  return $api.useQuery("get", "/applications")
}

export function useApplication(uuid: string | undefined) {
  return $api.useQuery(
    "get", "/applications/{uuid}",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid },
  )
}

export function useRestartApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/restart", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Restart queued")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => toast.error("Failed to restart"),
  })
}

export function useStartApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/start", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Deployment queued")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => toast.error("Failed to start"),
  })
}

export function useStopApplication(uuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fetchClient.GET("/applications/{uuid}/stop", { params: { path: { uuid } } }),
    onSuccess: () => {
      toast.success("Stop requested")
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(uuid) })
      void queryClient.invalidateQueries({ queryKey: deploymentKeys.byApplication(uuid) })
    },
    onError: () => toast.error("Failed to stop"),
  })
}
