import { fetchBaseQuery } from '@reduxjs/toolkit/query'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'

import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'

import { unauthorizedDetected } from './authEvents'
import type { AuthScope } from './authScope'
import { readCsrfToken } from './authScope'

/** Per-endpoint knobs, set via an endpoint's `extraOptions`. */
export interface ApiExtraOptions {
  /** Which credential to attach. Defaults to `user`. */
  authScope?: AuthScope
  /** Overrides the default retry budget (2 for GET, 0 for mutations). */
  maxRetries?: number
  /** Set on the refresh call itself, so it can never try to refresh itself. */
  skipReauth?: boolean
}

/**
 * The only part of the store the transport layer needs to know about. Declared
 * structurally so `shared` never imports from `features`.
 */
interface TokenBearingState {
  auth: { token: string | null; mfaToken: string | null }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  // Required for the refresh cookie to travel. Paired with a named origin
  // server-side: the CORS spec forbids credentials with a wildcard origin.
  credentials: 'include',
  prepareHeaders: (headers, { getState, extraOptions }) => {
    headers.set('Accept', 'application/json')

    const csrf = readCsrfToken()
    if (csrf) headers.set('X-CSRF-Token', csrf)

    const scope = (extraOptions as ApiExtraOptions | undefined)?.authScope ?? 'user'
    if (scope === 'public') return headers

    const state = (getState() as TokenBearingState).auth
    const token = scope === 'mfa' ? state.mfaToken : state.token
    if (token) headers.set('Authorization', `Bearer ${token}`)

    return headers
  },
})

/** Transient failures only. 429 is excluded — the API rate-limits on purpose. */
const RETRYABLE_STATUSES = new Set([502, 503, 504])

function isRetryable(error: FetchBaseQueryError): boolean {
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return true
  return typeof error.status === 'number' && RETRYABLE_STATUSES.has(error.status)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * A single in-flight refresh, shared by every caller.
 *
 * Without this, an expired access token on a screen that fires four queries at
 * once produces four refresh calls. The first rotates the cookie; the other
 * three arrive holding a token that has just been marked used — which the
 * backend correctly reads as token theft and responds to by revoking the whole
 * family and signing the user out. The mutex is not an optimisation; it is what
 * stops normal usage from looking like an attack.
 */
let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: ApiExtraOptions,
): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const result = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        { ...extraOptions, authScope: 'public', skipReauth: true },
      )

      if (result.error) {
        logger.debug('session refresh failed')
        return false
      }

      // Imported lazily: `shared` must not depend on `features` at module load,
      // or the two form an import cycle through the store.
      const { sessionReceived } = await import('@/features/auth/model/authSlice')
      const { parseSession } = await import('@/features/auth/model/parse')

      api.dispatch(sessionReceived(parseSession(result.data)))
      logger.debug('session refreshed')
      return true
    } catch {
      return false
    } finally {
      // Cleared in a microtask so concurrent callers all observe the same
      // promise before the next request can start a second one.
      queueMicrotask(() => {
        refreshInFlight = null
      })
    }
  })()

  return refreshInFlight
}

/**
 * `fetchBaseQuery` plus the three cross-cutting concerns every endpoint wants:
 * bounded retries for idempotent reads, one silent refresh when the access
 * token has aged out, and a single place where a dead session becomes an
 * app-wide event.
 */
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  ApiExtraOptions
> = async (args, api, extraOptions) => {
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET')
  const scope = extraOptions?.authScope ?? 'user'
  const maxRetries = extraOptions?.maxRetries ?? (method === 'GET' ? 2 : 0)

  let result = await rawBaseQuery(args, api, extraOptions)

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    if (!result.error || !isRetryable(result.error) || api.signal.aborted) break

    // Exponential backoff with jitter, so a recovering backend is not hit by a
    // synchronised wave of retries from every open tab.
    await delay(2 ** (attempt - 1) * 300 + Math.random() * 100)
    if (api.signal.aborted) break

    logger.debug('retrying request', { endpoint: api.endpoint, attempt })
    result = await rawBaseQuery(args, api, extraOptions)
  }

  const shouldReauth =
    result.error?.status === 401 &&
    scope === 'user' &&
    !extraOptions?.skipReauth &&
    !api.signal.aborted

  if (shouldReauth) {
    const refreshed = await refreshSession(api, extraOptions ?? {})

    if (refreshed) {
      // Re-issued with the new token, which `prepareHeaders` now reads.
      result = await rawBaseQuery(args, api, extraOptions)
    }

    if (!refreshed || result.error?.status === 401) {
      api.dispatch(unauthorizedDetected({ scope }))
    }
  }

  // A 401 on the MFA step means the challenge expired, which ends the flow.
  if (result.error?.status === 401 && scope === 'mfa') {
    api.dispatch(unauthorizedDetected({ scope }))
  }

  return result
}
