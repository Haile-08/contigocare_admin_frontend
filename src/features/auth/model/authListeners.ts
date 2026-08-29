import { isAnyOf } from '@reduxjs/toolkit'

import type { AppStartListening } from '@/app/store/listenerMiddleware'
import { unauthorizedDetected } from '@/shared/api/authEvents'
import { baseApi } from '@/shared/api/baseApi'
import { logger } from '@/shared/lib/logger'

import { clearCredentials, saveCredentials } from '../lib/tokenStorage'
import { credentialsReceived, loggedOut } from './authSlice'

/**
 * Keeps persisted credentials in step with the store, and — critically —
 * wipes the API cache whenever a session ends. Without the reset, cached
 * messages and session names from the previous account would still be in
 * memory for the next person to sign in on this tab.
 */
export function registerAuthListeners(startListening: AppStartListening): void {
  startListening({
    actionCreator: credentialsReceived,
    effect: (action) => {
      saveCredentials(action.payload)
    },
  })

  startListening({
    matcher: isAnyOf(loggedOut, unauthorizedDetected),
    effect: (action, listenerApi) => {
      // A rejected *session* token does not end the user's sign-in.
      if (unauthorizedDetected.match(action) && action.payload.scope !== 'user') return

      clearCredentials()
      listenerApi.dispatch(baseApi.util.resetApiState())
      logger.debug('signed out; api cache cleared')
    },
  })
}
