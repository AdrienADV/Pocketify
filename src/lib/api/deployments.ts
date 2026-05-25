import { useMutation } from "@tanstack/react-query"
import { $api, fetchClient } from "@/lib/api/client"
import { useHasActiveResourceOperations, useResourceOperation } from "@/lib/operation-tracker"
import { toast } from "sonner"

export const deploymentKeys = {
  lists: ["get", "/deployments"] as const,
  byApplication: (uuid: string) => ["get", "/deployments/applications/{uuid}", { params: { path: { uuid } } }] as const,
  details: ["get", "/deployments/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/deployments/{uuid}", { params: { path: { uuid } } }] as const,
}

export function useDeployments() {
  const hasApplicationOperations = useHasActiveResourceOperations("application")

  return $api.useQuery("get", "/deployments", {}, {
    refetchInterval: (query) => {
      if (hasApplicationOperations) return 3000
      const data = query.state.data
      if (!data || data.length === 0) return false
      return data.some((d) => d.status === "in_progress" || d.status === "queued") ? 3000 : false
    },
  })
}

export function useApplicationDeployments(uuid: string | undefined) {
  const operation = useResourceOperation("application", uuid)

  return $api.useQuery(
    "get", "/deployments/applications/{uuid}",
    { params: { path: { uuid: uuid! }, query: { take: 10 } } },
    {
      enabled: !!uuid,
      refetchInterval: operation ? 3000 : false,
    },
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDeployment(uuid: string | undefined, options?: Record<string, any>) {
  return $api.useQuery(
    "get", "/deployments/{uuid}",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid, ...options },
  )
}

export function useCancelDeployment(uuid: string) {
  return useMutation({
    mutationFn: () => fetchClient.POST("/deployments/{uuid}/cancel", { params: { path: { uuid } } }),
    onSuccess: () => toast.success("Deployment cancelled"),
    onError: () => toast.error("Failed to cancel"),
  })
}
