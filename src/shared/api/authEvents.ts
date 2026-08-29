import { createAction } from '@reduxjs/toolkit'

import type { AuthScope } from './authScope'

/**
 * Dispatched by the base query when the API rejects an authenticated request.
 *
 * It lives in `shared` so the transport layer never has to import a feature
 * slice: features subscribe to this action instead. That keeps the dependency
 * direction one-way (features -> shared) and avoids an import cycle.
 */
export const unauthorizedDetected = createAction<{ scope: AuthScope }>(
  'auth/unauthorizedDetected',
)
