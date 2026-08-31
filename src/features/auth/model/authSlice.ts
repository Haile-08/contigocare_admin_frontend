import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { unauthorizedDetected } from '@/shared/api/authEvents'

import type { AdminProfile, AuthStage, LoginChallenge, LogoutReason, Session } from './types'

export interface AuthState {
  admin: AdminProfile | null
  /**
   * The access token, held in memory and nowhere else.
   *
   * The previous version of this app persisted it to sessionStorage, because
   * without persistence a page reload signed the user out. That trade-off is
   * gone: the refresh token now lives in an HttpOnly cookie the browser sends
   * on its own, so a reload can silently re-establish the session without any
   * token ever being written somewhere script can read it.
   *
   * Which means an XSS on this page can steal at most one 15-minute token, and
   * cannot steal the thing that mints more.
   */
  token: string | null
  expiresAt: string | null

  /** Set between password and TOTP. Also memory-only, and lives ~5 minutes. */
  mfaToken: string | null
  stage: AuthStage
  enrollmentRequired: boolean

  /** Shown once after enrolment, then dropped. Never persisted. */
  recoveryCodes: string[] | null

  /** True until the first refresh attempt settles, so guards do not flash. */
  bootstrapping: boolean

  /** Set when a session ends, so the login screen can explain why. */
  logoutReason: LogoutReason | null
}

const emptySession = {
  admin: null,
  token: null,
  expiresAt: null,
  mfaToken: null,
  stage: 'credentials' as AuthStage,
  enrollmentRequired: false,
  recoveryCodes: null,
}

const initialState: AuthState = {
  ...emptySession,
  bootstrapping: true,
  logoutReason: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    challengeReceived: (state, action: PayloadAction<LoginChallenge>) => {
      state.mfaToken = action.payload.mfaToken
      state.enrollmentRequired = action.payload.enrollmentRequired
      state.stage = action.payload.enrollmentRequired ? 'enroll' : 'verify'
      state.logoutReason = null
    },

    stageChanged: (state, action: PayloadAction<AuthStage>) => {
      state.stage = action.payload
    },

    sessionReceived: (state, action: PayloadAction<Session>) => {
      state.admin = action.payload.admin
      state.token = action.payload.token
      state.expiresAt = action.payload.expiresAt
      state.recoveryCodes = action.payload.recoveryCodes ?? null
      // The challenge is spent the moment it becomes a session.
      state.mfaToken = null
      state.stage = 'credentials'
      state.enrollmentRequired = false
      state.bootstrapping = false
      state.logoutReason = null
    },

    recoveryCodesDismissed: (state) => {
      state.recoveryCodes = null
    },

    bootstrapFinished: (state) => {
      state.bootstrapping = false
    },

    loggedOut: {
      reducer: (state, action: PayloadAction<{ reason: LogoutReason }>) => ({
        ...emptySession,
        bootstrapping: false,
        logoutReason: action.payload.reason,
        // A deliberate sign-out from a fresh boot should not report an expiry.
        ...(state.token === null && action.payload.reason === 'session-expired'
          ? { logoutReason: null }
          : {}),
      }),
      prepare: (reason: LogoutReason = 'user-action') => ({ payload: { reason } }),
    },

    logoutReasonCleared: (state) => {
      state.logoutReason = null
    },
  },

  extraReducers: (builder) => {
    // The API rejected a credential that should have worked, and the refresh
    // attempt behind it also failed. The session is over.
    builder.addCase(unauthorizedDetected, (state) => ({
      ...emptySession,
      bootstrapping: false,
      logoutReason: state.token ? ('session-expired' as const) : state.logoutReason,
    }))
  },

  selectors: {
    selectAdmin: (state) => state.admin,
    selectAuthToken: (state) => state.token,
    selectIsAuthenticated: (state) => Boolean(state.token),
    selectMfaToken: (state) => state.mfaToken,
    selectAuthStage: (state) => state.stage,
    selectEnrollmentRequired: (state) => state.enrollmentRequired,
    selectRecoveryCodes: (state) => state.recoveryCodes,
    selectBootstrapping: (state) => state.bootstrapping,
    selectLogoutReason: (state) => state.logoutReason,
  },
})

export const {
  challengeReceived,
  stageChanged,
  sessionReceived,
  recoveryCodesDismissed,
  bootstrapFinished,
  loggedOut,
  logoutReasonCleared,
} = authSlice.actions

export const {
  selectAdmin,
  selectAuthToken,
  selectIsAuthenticated,
  selectMfaToken,
  selectAuthStage,
  selectEnrollmentRequired,
  selectRecoveryCodes,
  selectBootstrapping,
  selectLogoutReason,
} = authSlice.selectors
