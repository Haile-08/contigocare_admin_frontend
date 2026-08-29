import { fetchBaseQuery } from '@reduxjs/toolkit/query'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'

import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'

import { unauthorizedDetected } from './authEvents'
import type { AuthScope } from './authScope'

/** Per-endpoint knobs, set via an endpoint's `extraOptions`. */
export interface ApiExtraOptions {
  /** Which credential to attach. Defaults to `user`. */
  authScope?: AuthScope
  /** Overrides the default retry budget (2 for GET, 0 for mutations). */
  maxRetries?: number
}

/**
 * The only part of the store the transport layer needs to know about. Declared
 * structurally so `shared` never imports from `features`.
 */
interface TokenBearingState {
  auth: { token: string | null }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  prepareHeaders: (headers, { getState, extraOptions }) => {
    headers.set('Accept', 'application/json')

    // An endpoint that targets a specific chat session supplies its own token
    // via `withSessionToken()`; never overwrite it.
    if (headers.has('Authorization')) return headers

    const scope = (extraOptions as ApiExtraOptions | undefined)?.authScope ?? 'user'
    if (scope !== 'user') return headers

    const token = (getState() as TokenBearingState).auth.token
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
 * `fetchBaseQuery` plus two cross-cutting concerns every endpoint wants:
 * bounded retries for idempotent reads, and a single place where an expired
 * credential is turned into an app-wide event.
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

  // A 401 on a *public* endpoint just means "wrong password" — not an expiry.
  if (result.error?.status === 401 && scope !== 'public') {
    api.dispatch(unauthorizedDetected({ scope }))
  }

  return result
}
