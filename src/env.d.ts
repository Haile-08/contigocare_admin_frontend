/// <reference types="vite/client" />

/**
 * Declared for editor completion only. Values are validated at runtime in
 * `@/shared/config/env` — always import from there rather than reading
 * `import.meta.env` directly.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_ENABLE_DEVTOOLS?: string
  readonly VITE_REQUEST_TIMEOUT_MS?: string
  readonly VITE_TOKEN_STORAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
