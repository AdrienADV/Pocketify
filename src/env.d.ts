/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Coolify API base URL par défaut (cloud officiel). Peut être surchargée via localStorage("coolify_api_url") pour un self-host. */
  readonly VITE_COOLIFY_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
