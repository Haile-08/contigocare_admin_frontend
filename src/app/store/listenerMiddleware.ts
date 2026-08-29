import { createListenerMiddleware } from '@reduxjs/toolkit'

import type { AppDispatch, RootState } from './types'

/**
 * Side effects that react to actions (persistence, cache resets, analytics)
 * live in listeners rather than in components or reducers. Reducers stay pure
 * and each effect is testable on its own.
 *
 * A factory rather than a singleton: every store gets its own listener
 * instance, so tests can spin up isolated stores without effects leaking
 * between them.
 */
export function createAppListenerMiddleware() {
  const listenerMiddleware = createListenerMiddleware()

  return {
    middleware: listenerMiddleware.middleware,
    startListening: listenerMiddleware.startListening.withTypes<RootState, AppDispatch>(),
  }
}

export type AppStartListening = ReturnType<
  typeof createAppListenerMiddleware
>['startListening']
