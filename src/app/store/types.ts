import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import type { RootState } from './rootReducer'

/**
 * Declared structurally rather than as `typeof store.dispatch` so that files
 * needed *while building* the store (listeners, middleware) can be typed
 * without a circular reference back to the store instance.
 */
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>

export type { RootState }
