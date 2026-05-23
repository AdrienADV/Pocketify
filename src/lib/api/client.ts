import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"
import type { paths } from "@/lib/api/v1"

const baseUrl = localStorage.getItem("coolify_api_url") ?? import.meta.env.VITE_COOLIFY_API_URL

export const fetchClient = createFetchClient<paths>({ baseUrl })

fetchClient.use({
  onRequest({ request }) {
    const token = localStorage.getItem("coolify_api_token")
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }
    return request
  },
})

/** Type-safe React Query hooks for the Coolify API */
export const $api = createClient(fetchClient)
