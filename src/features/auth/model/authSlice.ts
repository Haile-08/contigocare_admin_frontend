import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { unauthorizedDetected } from '@/shared/api/authEvents'

import type { AuthCredentials, AuthUser, LogoutReason } from './types'

export interface AuthState {
  user: AuthUser | null
  token: string | null
  expiresAt: string | null
  /** Set when a session ends, so the login screen can explain why. */
  logoutReason: LogoutReason | null
}

const emptyState: AuthState = {
  user: null,
  token: null,
  expiresAt: null,
  logoutReason: null,
}

/**
 * Hydration from storage happens in `initialState` (see `preloadedAuthState` in
 * the store setup) rather than in an effect, so the very first render already
 * knows whether the user is signed in — no auth flicker, no redirect race.
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState: emptyState,
  reducers: {
    credentialsReceived: (state, action: PayloadAction<AuthCredentials>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.expiresAt = action.payload.expiresAt
      state.logoutReason = null
    },

    loggedOut: {
      reducer: (_state, action: PayloadAction<{ reason: LogoutReason }>) => ({
        ...emptyState,
        logoutReason: action.payload.reason,
      }),
      prepare: (reason: LogoutReason = 'user-action') => ({ payload: { reason } }),
    },

    logoutReasonCleared: (state) => {
      state.logoutReason = null
    },
  },

  extraReducers: (builder) => {
    // The API rejected our user token: it expired or was revoked server-side.
    builder.addCase(unauthorizedDetected, (state, action) =>
      action.payload.scope === 'user'
        ? { ...emptyState, logoutReason: 'session-expired' as const }
        : state,
    )
  },

  selectors: {
    selectAuthUser: (state) => state.user,
    selectAuthToken: (state) => state.token,
    selectIsAuthenticated: (state) => Boolean(state.token),
    selectLogoutReason: (state) => state.logoutReason,
  },
})

export const { credentialsReceived, loggedOut, logoutReasonCleared } = authSlice.actions

export const { selectAuthUser, selectAuthToken, selectIsAuthenticated, selectLogoutReason } =
  authSlice.selectors
