import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQueryWithAuth } from './baseQuery'

/**
 * The single API slice.
 *
 * Endpoints are *injected* by each feature (see `features/<name>/api`) rather
 * than declared here, so this file never grows and features stay self-contained.
 * One slice means one cache, one middleware, and cross-feature tag
 * invalidation that actually works.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Session', 'Messages'],
  // Data is user-specific and cheap to refetch; keep it briefly and revalidate.
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})

export type BaseApi = typeof baseApi
