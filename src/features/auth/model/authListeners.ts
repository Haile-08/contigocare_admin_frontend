import { isAnyOf } from '@reduxjs/toolkit'

import type { AppStartListening } from '@/app/store/listenerMiddleware'
import { unauthorizedDetected } from '@/shared/api/authEvents'
import { baseApi } from '@/shared/api/baseApi'
import { logger } from '@/shared/lib/logger'

import { loggedOut } from './authSlice'

/**
 * Wipes the API cache whenever a session ends.
 *
 * Nothing is persisted any more, so there is no storage to keep in step — but
 * the cache reset matters more here than it did before. RTK Query holds the
 * last analysis in memory, and an analysis is policy content. Without the
 * reset, the next person to sign in on this machine would find the previous
 * operator's results already rendered.
 */
export function registerAuthListeners(startListening: AppStartListening): void {
  startListening({
    matcher: isAnyOf(loggedOut, unauthorizedDetected),
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(baseApi.util.resetApiState())
      logger.debug('signed out; api cache cleared')
    },
  })
}
