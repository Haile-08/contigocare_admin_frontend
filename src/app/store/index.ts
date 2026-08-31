import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { registerAuthListeners } from '@/features/auth/model/authListeners'
import { registerUiListeners } from '@/features/ui/model/uiListeners'
import { baseApi } from '@/shared/api/baseApi'
import { env } from '@/shared/config/env'

import { createAppListenerMiddleware } from './listenerMiddleware'
import { rootReducer } from './rootReducer'
import type { RootState } from './types'

/**
 * Builds a store. Exported as a factory so tests (and any future SSR entry)
 * can create a fresh, fully wired store instead of reaching for the singleton.
 *
 * There is no preloaded auth state any more. Credentials are no longer written
 * to browser storage, so there is nothing to rehydrate — the session is
 * re-established from the HttpOnly refresh cookie by `App` on mount.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  const listener = createAppListenerMiddleware()
  registerAuthListeners(listener.startListening)
  registerUiListeners(listener.startListening)

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        // Listeners run before the API middleware so persistence reacts to an
        // action before any refetch it triggers.
        .prepend(listener.middleware)
        .concat(baseApi.middleware),
    // Never in production: DevTools expose the entire store, tokens included.
    devTools: env.enableDevtools,
  })

  // Enables `refetchOnFocus` / `refetchOnReconnect`.
  setupListeners(store.dispatch)

  return store
}

export const store = makeStore()

export type AppStore = ReturnType<typeof makeStore>
export type { AppDispatch, RootState } from './types'
