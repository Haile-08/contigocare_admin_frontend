import { logger } from './logger'

/**
 * Typed, crash-proof `localStorage` for *preferences* — theme, whether the nav
 * rail is collapsed. Nothing sensitive belongs here; credentials have their own
 * store (see `features/auth/lib/tokenStorage`), which deliberately does not use
 * localStorage.
 *
 * Every access is guarded: `localStorage` throws outright in some privacy
 * modes, and a stored value can be anything a previous version wrote. A
 * preference that cannot be read is not worth an error screen, so the default
 * is returned instead.
 */

export const STORAGE_KEYS = {
  theme: 'contigocare.ui.theme',
  locale: 'contigocare.ui.locale',
  sidebar: 'contigocare.ui.sidebarCollapsed',
  opsRail: 'contigocare.ui.opsRailOpen',
} as const

export interface Storage<T> {
  read: () => T
  write: (value: T) => void
}

export function createStorage<T>(key: string, fallback: T): Storage<T> {
  return {
    read: () => {
      try {
        const raw = globalThis.localStorage?.getItem(key)
        return raw === null || raw === undefined ? fallback : (JSON.parse(raw) as T)
      } catch {
        return fallback
      }
    },
    write: (value: T) => {
      try {
        globalThis.localStorage?.setItem(key, JSON.stringify(value))
      } catch {
        logger.debug('could not persist preference', { key })
      }
    },
  }
}
