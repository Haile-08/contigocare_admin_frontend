import { z } from 'zod'

import { env } from '@/shared/config/env'
import { isJwtExpired } from '@/shared/lib/jwt'
import { logger } from '@/shared/lib/logger'

import type { AuthCredentials } from '../model/types'

/**
 * Where the user token lives between page loads.
 *
 * SECURITY NOTE — any browser-readable store (localStorage, sessionStorage,
 * memory) is readable by injected script, so token persistence is an XSS blast
 * radius, not an XSS defence. The chosen trade-off:
 *
 *   - `session` (default) — sessionStorage: scoped to one tab, dropped when the
 *     tab closes, never shared with other tabs or windows. Survives reloads.
 *   - `memory` — nothing is persisted; a reload signs the user out. Strictest.
 *
 * localStorage is deliberately not an option: it persists indefinitely across
 * every tab. The real fix is server-side — have the API set an `HttpOnly`,
 * `Secure`, `SameSite=Strict` cookie so the token is unreachable from JS. This
 * module is the single place that would change if the backend adds that.
 *
 * Only the *user* token is persisted. Session tokens are re-issued by
 * `GET /auth/sessions` on every load, so they never need to be written down.
 */

const STORAGE_KEY = 'contigocare.auth.v1'

const persistedSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
  user: z.object({
    id: z.number().nullable(),
    email: z.string(),
    username: z.string().nullable(),
  }),
})

interface CredentialStore {
  read: () => AuthCredentials | null
  write: (credentials: AuthCredentials) => void
  clear: () => void
}

function createMemoryStore(): CredentialStore {
  let value: AuthCredentials | null = null
  return {
    read: () => value,
    write: (credentials) => {
      value = credentials
    },
    clear: () => {
      value = null
    },
  }
}

/** `sessionStorage` throws in some privacy modes — fall back rather than crash. */
function getSessionStorage(): Storage | null {
  try {
    const probe = '__contigocare_probe__'
    globalThis.sessionStorage.setItem(probe, '1')
    globalThis.sessionStorage.removeItem(probe)
    return globalThis.sessionStorage
  } catch {
    logger.warn('sessionStorage unavailable; auth will not survive a reload')
    return null
  }
}

function createSessionStore(storage: Storage): CredentialStore {
  return {
    read: () => {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return null

      try {
        const parsed = persistedSchema.safeParse(JSON.parse(raw))
        if (!parsed.success) {
          storage.removeItem(STORAGE_KEY)
          return null
        }
        return parsed.data
      } catch {
        storage.removeItem(STORAGE_KEY)
        return null
      }
    },
    write: (credentials) => {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(credentials))
      } catch {
        logger.warn('could not persist credentials')
      }
    },
    clear: () => {
      try {
        storage.removeItem(STORAGE_KEY)
      } catch {
        /* nothing useful to do */
      }
    },
  }
}

function createStore(): CredentialStore {
  if (env.tokenStorage === 'memory') return createMemoryStore()
  const storage = getSessionStorage()
  return storage ? createSessionStore(storage) : createMemoryStore()
}

const store = createStore()

/** Returns stored credentials, discarding anything already expired. */
export function loadCredentials(): AuthCredentials | null {
  const credentials = store.read()
  if (!credentials) return null

  const expired =
    isJwtExpired(credentials.token) || new Date(credentials.expiresAt).getTime() <= Date.now()

  if (expired) {
    store.clear()
    return null
  }

  return credentials
}

export function saveCredentials(credentials: AuthCredentials): void {
  store.write(credentials)
}

export function clearCredentials(): void {
  store.clear()
}
