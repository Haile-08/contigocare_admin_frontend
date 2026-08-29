import { z } from 'zod'

/**
 * The wire contract, validated at the boundary.
 *
 * Parsing responses means a backend change surfaces as one clear error in the
 * API layer instead of `undefined is not an object` somewhere in a component.
 * The camelCase domain types below are what the rest of the app consumes — the
 * snake_case wire shape stops here.
 */

export const tokenPayloadSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_at: z.string(),
})

export const registerResponseSchema = z.object({
  request_id: z.string().optional(),
  id: z.number(),
  email: z.string(),
  username: z.string().nullish(),
  token: tokenPayloadSchema,
})

export const loginResponseSchema = z.object({
  request_id: z.string().optional(),
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_at: z.string(),
})

/** Domain types. */

export interface AuthUser {
  /** Null right after login: the API returns only a token, no profile. */
  id: number | null
  email: string
  username: string | null
}

export interface AuthCredentials {
  user: AuthUser
  token: string
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export type LogoutReason = 'user-action' | 'session-expired'
