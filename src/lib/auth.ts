const DEFAULT_API_URL = import.meta.env.VITE_COOLIFY_API_URL

export function getApiUrl(): string {
  return localStorage.getItem("coolify_api_url") ?? DEFAULT_API_URL
}

export function getToken(): string | null {
  return localStorage.getItem("coolify_api_token")
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("coolify_api_token")
}

export function normalizeApiUrl(url: string): string {
  let normalized = url.trim().replace(/\/$/, "")
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`
  }
  if (!normalized.endsWith("/api/v1")) {
    normalized = `${normalized}/api/v1`
  }
  return normalized
}

export function saveCredentials(apiUrl: string, token: string): void {
  localStorage.setItem("coolify_api_url", apiUrl)
  localStorage.setItem("coolify_api_token", token)
}

export function clearCredentials(): void {
  localStorage.removeItem("coolify_api_url")
  localStorage.removeItem("coolify_api_token")
}

export async function validateCredentials(apiUrl: string, token: string): Promise<void> {
  const res = await fetch(`${apiUrl}/teams/current`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
  if (res.status === 401) throw new Error("Invalid or expired token")
  if (res.status === 404) throw new Error("Coolify instance not found")
  if (!res.ok) throw new Error(`Error ${res.status} — check your URL`)
}
