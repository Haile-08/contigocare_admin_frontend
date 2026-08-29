import { describe, expect, it } from 'vitest'

import { unauthorizedDetected } from '@/shared/api/authEvents'

import { authSlice, credentialsReceived, loggedOut } from './authSlice'
import type { AuthCredentials } from './types'

const credentials: AuthCredentials = {
  user: { id: 7, email: 'nurse@contigo.care', username: 'Nurse' },
  token: 'header.payload.signature',
  expiresAt: '2099-01-01T00:00:00Z',
}

const signedIn = authSlice.reducer(undefined, credentialsReceived(credentials))

describe('authSlice', () => {
  it('starts signed out', () => {
    const state = authSlice.reducer(undefined, { type: '@@INIT' })

    expect(state.token).toBeNull()
    expect(authSlice.selectors.selectIsAuthenticated({ auth: state })).toBe(false)
  })

  it('stores credentials on sign in', () => {
    expect(signedIn.token).toBe(credentials.token)
    expect(signedIn.user).toEqual(credentials.user)
    expect(authSlice.selectors.selectIsAuthenticated({ auth: signedIn })).toBe(true)
  })

  it('clears everything on sign out and records why', () => {
    const state = authSlice.reducer(signedIn, loggedOut())

    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.logoutReason).toBe('user-action')
  })

  it('signs the user out when the API rejects the user token', () => {
    const state = authSlice.reducer(signedIn, unauthorizedDetected({ scope: 'user' }))

    expect(state.token).toBeNull()
    expect(state.logoutReason).toBe('session-expired')
  })

  it('keeps the user signed in when only a session token is rejected', () => {
    // A stale *session* token means one conversation is gone, not the account.
    const state = authSlice.reducer(signedIn, unauthorizedDetected({ scope: 'session' }))

    expect(state.token).toBe(credentials.token)
  })

  it('forgets the logout reason once shown', () => {
    const state = authSlice.reducer(
      authSlice.reducer(signedIn, loggedOut('session-expired')),
      authSlice.actions.logoutReasonCleared(),
    )

    expect(state.logoutReason).toBeNull()
  })
})
