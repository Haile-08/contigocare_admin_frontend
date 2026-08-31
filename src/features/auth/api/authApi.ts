import { baseApi } from '@/shared/api/baseApi'
import { logger } from '@/shared/lib/logger'

import { challengeReceived, loggedOut, sessionReceived } from '../model/authSlice'
import {
  parseChallenge,
  parseEnrollment,
  parsePasswordResetAck,
  parseSession,
} from '../model/parse'
import type {
  Enrollment,
  LoginChallenge,
  LoginRequest,
  MfaVerifyRequest,
  PasswordResetAck,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RecoveryRequest,
  Session,
} from '../model/types'

/**
 * The sign-in flow, endpoint by endpoint.
 *
 * `login` is `public`. Everything between it and a session is `mfa` scoped, so
 * those requests carry the challenge token rather than an access token — which
 * is the point of having two token types at all.
 *
 * The two password-reset endpoints are `public` and dispatch nothing into the
 * store on success. That is not an oversight: the server does not return a
 * session for them, and a client that invented one would be papering over the
 * guarantee that a reset link buys the password factor and nothing else.
 *
 * There is no `register` endpoint here because there is none on the server.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginChallenge, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email: body.email, password: body.password },
      }),
      extraOptions: { authScope: 'public' },
      transformResponse: parseChallenge,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(challengeReceived(data))
        } catch {
          logger.debug('login failed')
        }
      },
    }),

    startEnrollment: builder.mutation<Enrollment, void>({
      query: () => ({ url: '/auth/mfa/enroll/start', method: 'POST' }),
      extraOptions: { authScope: 'mfa' },
      transformResponse: parseEnrollment,
    }),

    confirmEnrollment: builder.mutation<Session, MfaVerifyRequest>({
      query: (body) => ({
        url: '/auth/mfa/enroll/confirm',
        method: 'POST',
        body: { code: body.code },
      }),
      extraOptions: { authScope: 'mfa' },
      transformResponse: parseSession,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionReceived(data))
        } catch {
          logger.debug('enrollment confirmation failed')
        }
      },
    }),

    verifyMfa: builder.mutation<Session, MfaVerifyRequest>({
      query: (body) => ({
        url: '/auth/mfa/verify',
        method: 'POST',
        body: { code: body.code },
      }),
      extraOptions: { authScope: 'mfa' },
      transformResponse: parseSession,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionReceived(data))
        } catch {
          logger.debug('mfa verification failed')
        }
      },
    }),

    useRecoveryCode: builder.mutation<Session, RecoveryRequest>({
      query: (body) => ({
        url: '/auth/mfa/recovery',
        method: 'POST',
        body: { recovery_code: body.recoveryCode },
      }),
      extraOptions: { authScope: 'mfa' },
      transformResponse: parseSession,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionReceived(data))
        } catch {
          logger.debug('recovery code rejected')
        }
      },
    }),

    /**
     * Ask for a reset link. Answers 202 with the same sentence whether or not
     * the address belongs to an account, so there is nothing here for the UI to
     * branch on — and nothing for a caller to learn from a failure.
     */
    requestPasswordReset: builder.mutation<PasswordResetAck, PasswordResetRequest>({
      query: (body) => ({
        url: '/auth/password/forgot',
        method: 'POST',
        body: { email: body.email },
      }),
      extraOptions: { authScope: 'public' },
      transformResponse: parsePasswordResetAck,
    }),

    /**
     * Redeem the token from the emailed link.
     *
     * Success leaves the operator signed out on purpose. They go back to the
     * login screen and complete both factors, which is what keeps a compromised
     * mailbox from being a compromised account.
     */
    resetPassword: builder.mutation<PasswordResetAck, PasswordResetConfirmRequest>({
      query: (body) => ({
        url: '/auth/password/reset',
        method: 'POST',
        body: { token: body.token, new_password: body.newPassword },
      }),
      extraOptions: { authScope: 'public' },
      transformResponse: parsePasswordResetAck,
    }),

    /**
     * Called once at startup to see whether the HttpOnly cookie still names a
     * live session. This is what replaces persisting a token: the browser
     * proves the session, rather than the app writing down a credential.
     */
    bootstrapSession: builder.mutation<Session, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      extraOptions: { authScope: 'public', skipReauth: true },
      transformResponse: parseSession,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionReceived(data))
        } catch {
          logger.debug('no resumable session')
        }
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      extraOptions: { authScope: 'public', skipReauth: true },
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled
        } catch {
          // A failed logout call must still clear local state — otherwise a
          // network blip leaves the console looking signed in.
          logger.debug('logout request failed; clearing locally anyway')
        } finally {
          dispatch(loggedOut('user-action'))
        }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useStartEnrollmentMutation,
  useConfirmEnrollmentMutation,
  useVerifyMfaMutation,
  useUseRecoveryCodeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useBootstrapSessionMutation,
  useLogoutMutation,
} = authApi
