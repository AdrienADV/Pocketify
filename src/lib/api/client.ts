import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"
import type { paths } from "@/lib/api/v1"
import { getApiUrl, getToken } from "@/lib/auth"

export const fetchClient = createFetchClient<paths>({ baseUrl: "/" })

fetchClient.use({
  onRequest({ request }) {
    const token = getToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }

    const base = getApiUrl()
    const url = new URL(request.url)
    const newUrl = base + url.pathname + url.search
    return new Request(newUrl, request)
  },
})

/** Hooks React Query type-safe pour l'API Coolify */
export const $api = createClient(fetchClient)
