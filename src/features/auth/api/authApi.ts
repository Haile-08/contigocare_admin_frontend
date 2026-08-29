import { baseApi } from '@/shared/api/baseApi'
import { decodeJwtClaims } from '@/shared/lib/jwt'
import { logger } from '@/shared/lib/logger'

import { credentialsReceived } from '../model/authSlice'
import type { AuthCredentials, LoginRequest, RegisterRequest } from '../model/types'
import { loginResponseSchema, registerResponseSchema } from '../model/types'

/** The account id is carried in the JWT `sub` claim; login returns no profile. */
function userIdFromToken(token: string): number | null {
  const sub = decodeJwtClaims(token)?.sub
  if (!sub) return null
  const parsed = Number(sub)
  return Number.isInteger(parsed) ? parsed : null
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthCredentials, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body: {
          email: body.email,
          password: body.password,
          ...(body.username ? { username: body.username } : {}),
        },
      }),
      extraOptions: { authScope: 'public' },
      transformResponse: (response: unknown): AuthCredentials => {
        const data = registerResponseSchema.parse(response)
        return {
          user: { id: data.id, email: data.email, username: data.username ?? null },
          token: data.token.access_token,
          expiresAt: data.token.expires_at,
        }
      },
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(credentialsReceived(data))
        } catch {
          logger.debug('registration failed')
        }
      },
    }),

    login: builder.mutation<AuthCredentials, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        // The endpoint is an OAuth2 password grant: form-encoded, not JSON.
        body: new URLSearchParams({
          email: body.email,
          password: body.password,
          grant_type: 'password',
        }),
      }),
      extraOptions: { authScope: 'public' },
      transformResponse: (response: unknown, _meta, arg: LoginRequest): AuthCredentials => {
        const data = loginResponseSchema.parse(response)
        return {
          user: {
            id: userIdFromToken(data.access_token),
            email: arg.email,
            username: null,
          },
          token: data.access_token,
          expiresAt: data.expires_at,
        }
      },
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(credentialsReceived(data))
        } catch {
          logger.debug('login failed')
        }
      },
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authApi
