import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"
import type { paths } from "@/lib/api/v1"
import { getApiUrl, getToken } from "@/lib/auth"

const INITIAL_BASE_URL = getApiUrl()

export const fetchClient = createFetchClient<paths>({ baseUrl: INITIAL_BASE_URL })

fetchClient.use({
  onRequest({ request }) {
    const token = getToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }

    // Réécriture dynamique de l'URL si elle a changé depuis l'init du module
    // (cas onboarding : l'utilisateur configure son instance après le premier chargement)
    const currentUrl = getApiUrl()
    if (currentUrl !== INITIAL_BASE_URL) {
      const newUrl = currentUrl + request.url.slice(INITIAL_BASE_URL.length)
      return new Request(newUrl, request)
    }

    return request
  },
})

/** Hooks React Query type-safe pour l'API Coolify */
export const $api = createClient(fetchClient)
