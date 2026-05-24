import { useQuery } from "@tanstack/react-query"
import { getApiUrl, getToken } from "@/lib/auth"

export const instanceKeys = {
  version: ["instance", "version"] as const,
  health: ["instance", "health"] as const,
}

async function fetchInstanceText(path: "/version" | "/health") {
  const token = getToken()
  const res = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      Accept: "text/plain, text/html, */*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    throw new Error(`Instance request failed with status ${res.status}`)
  }

  return (await res.text()).trim()
}

export function useInstanceVersion() {
  return useQuery({
    queryKey: instanceKeys.version,
    queryFn: () => fetchInstanceText("/version"),
  })
}

export function useInstanceHealth() {
  return useQuery({
    queryKey: instanceKeys.health,
    queryFn: () => fetchInstanceText("/health"),
  })
}
