import { loadCredentials } from '../lib/tokenStorage'
import type { AuthState } from './authSlice'

/**
 * Reads persisted credentials so the store starts already authenticated.
 *
 * Doing this as preloaded state rather than in an effect means the first paint
 * already knows whether the user is signed in — no auth flicker and no race
 * between the router's redirect and hydration.
 */
export function loadPreloadedAuthState(): { auth: AuthState } | undefined {
  const credentials = loadCredentials()
  if (!credentials) return undefined

  return {
    auth: {
      user: credentials.user,
      token: credentials.token,
      expiresAt: credentials.expiresAt,
      logoutReason: null,
    },
  }
}
