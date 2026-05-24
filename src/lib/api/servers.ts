import { $api } from "@/lib/api/client"

export const serverKeys = {
  lists: ["get", "/servers"] as const,
  details: ["get", "/servers/{uuid}"] as const,
  detail: (uuid: string) => ["get", "/servers/{uuid}", { params: { path: { uuid } } }] as const,
  resources: (uuid: string) => ["get", "/servers/{uuid}/resources", { params: { path: { uuid } } }] as const,
}

export function useServers() {
  return $api.useQuery("get", "/servers")
}

export function useServer(uuid: string | undefined) {
  return $api.useQuery(
    "get", "/servers/{uuid}",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid },
  )
}

export function useServerResources(uuid: string | undefined) {
  return $api.useQuery(
    "get", "/servers/{uuid}/resources",
    { params: { path: { uuid: uuid! } } },
    { enabled: !!uuid },
  )
}
