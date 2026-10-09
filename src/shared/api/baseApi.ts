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
  tagTypes: ['Dashboard', 'Analysis', 'Navigation'],
  // Deliberately short. The cached queries are the dashboard and the policy
  // list, both cheap to refetch and both metadata only; the extract and analyze
  // endpoints are mutations and cache nothing, because a policy document is not
  // something that should sit in memory waiting for someone to navigate back.
  keepUnusedDataFor: 30,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})

export type BaseApi = typeof baseApi
