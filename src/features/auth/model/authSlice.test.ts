import { describe, expect, it } from 'vitest'

import { unauthorizedDetected } from '@/shared/api/authEvents'

import { authSlice, challengeReceived, loggedOut, sessionReceived } from './authSlice'
import type { LoginChallenge, Session } from './types'

const session: Session = {
  admin: {
    id: '3f1c2b7e-0000-4000-8000-000000000001',
    email: 'ops@karai.health',
    fullName: 'Ana Ruiz',
    mfaEnrolled: true,
    lastLoginAt: null,
  },
  token: 'header.payload.signature',
  expiresAt: '2099-01-01T00:00:00Z',
  expiresIn: 900,
  recoveryCodes: null,
}

const challenge: LoginChallenge = {
  mfaToken: 'challenge.token.value',
  expiresAt: '2099-01-01T00:00:00Z',
  enrollmentRequired: false,
}

const signedIn = authSlice.reducer(undefined, sessionReceived(session))

describe('authSlice', () => {
  it('starts signed out and bootstrapping', () => {
    const state = authSlice.reducer(undefined, { type: '@@INIT' })

    expect(state.token).toBeNull()
    expect(state.bootstrapping).toBe(true)
    expect(authSlice.selectors.selectIsAuthenticated({ auth: state })).toBe(false)
  })

  it('does not authenticate on a password alone', () => {
    // The whole point of the two-step login: a correct password produces a
    // challenge, and a challenge is not a session.
    const state = authSlice.reducer(undefined, challengeReceived(challenge))

    expect(state.mfaToken).toBe(challenge.mfaToken)
    expect(state.token).toBeNull()
    expect(authSlice.selectors.selectIsAuthenticated({ auth: state })).toBe(false)
    expect(state.stage).toBe('verify')
  })

  it('routes a first-time account to enrolment', () => {
    const state = authSlice.reducer(
      undefined,
      challengeReceived({ ...challenge, enrollmentRequired: true }),
    )

    expect(state.stage).toBe('enroll')
  })

  it('stores the session once both factors pass', () => {
    expect(signedIn.token).toBe(session.token)
    expect(signedIn.admin).toEqual(session.admin)
    expect(signedIn.bootstrapping).toBe(false)
    expect(authSlice.selectors.selectIsAuthenticated({ auth: signedIn })).toBe(true)
  })

  it('spends the challenge token when the session is issued', () => {
    const afterChallenge = authSlice.reducer(undefined, challengeReceived(challenge))
    const state = authSlice.reducer(afterChallenge, sessionReceived(session))

    expect(state.mfaToken).toBeNull()
  })

  it('clears everything on sign out and records why', () => {
    const state = authSlice.reducer(signedIn, loggedOut())

    expect(state.token).toBeNull()
    expect(state.admin).toBeNull()
    expect(state.logoutReason).toBe('user-action')
  })

  it('signs the user out when the API rejects the access token', () => {
    const state = authSlice.reducer(signedIn, unauthorizedDetected({ scope: 'user' }))

    expect(state.token).toBeNull()
    expect(state.logoutReason).toBe('session-expired')
  })

  it('does not claim a session expired when there was none', () => {
    // A failed bootstrap on a first visit is not an expiry, and telling the
    // operator their session ended when they never had one is a lie.
    const fresh = authSlice.reducer(undefined, { type: '@@INIT' })
    const state = authSlice.reducer(fresh, unauthorizedDetected({ scope: 'user' }))

    expect(state.logoutReason).toBeNull()
    expect(state.bootstrapping).toBe(false)
  })

  it('holds recovery codes until they are acknowledged', () => {
    const withCodes = authSlice.reducer(
      undefined,
      sessionReceived({ ...session, recoveryCodes: ['ABCDE-12345'] }),
    )

    expect(withCodes.recoveryCodes).toEqual(['ABCDE-12345'])

    const dismissed = authSlice.reducer(withCodes, authSlice.actions.recoveryCodesDismissed())
    expect(dismissed.recoveryCodes).toBeNull()
  })

  it('forgets the logout reason once shown', () => {
    const state = authSlice.reducer(
      authSlice.reducer(signedIn, loggedOut('session-expired')),
      authSlice.actions.logoutReasonCleared(),
    )

    expect(state.logoutReason).toBeNull()
  })
})
