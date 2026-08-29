import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { registerAuthListeners } from '@/features/auth/model/authListeners'
import { loadPreloadedAuthState } from '@/features/auth/model/preloadedState'
import { baseApi } from '@/shared/api/baseApi'
import { env } from '@/shared/config/env'

import { createAppListenerMiddleware } from './listenerMiddleware'
import { rootReducer } from './rootReducer'
import type { RootState } from './types'

/**
 * Builds a store. Exported as a factory so tests (and any future SSR entry)
 * can create a fresh, fully wired store instead of reaching for the singleton.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  const listener = createAppListenerMiddleware()
  registerAuthListeners(listener.startListening)

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

export const store = makeStore(loadPreloadedAuthState())

export type AppStore = ReturnType<typeof makeStore>
export type { AppDispatch, RootState } from './types'
