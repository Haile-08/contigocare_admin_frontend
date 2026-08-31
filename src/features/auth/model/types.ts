import { z } from 'zod'

/**
 * The wire contract, validated at the boundary.
 *
 * Parsing responses means a backend change surfaces as one clear error in the
 * API layer instead of `undefined is not an object` somewhere in a component.
 * The camelCase domain types below are what the rest of the app consumes — the
 * snake_case wire shape stops here.
 *
 * There is no register request or response. Accounts are created directly in
 * the database by an operator running `scripts/create_admin.py`; the console
 * has no way to make one and no screen that asks. The password reset shapes
 * below are not an exception — they change the password on an account that
 * already exists, and the reply is deliberately never a session.
 */

export const adminProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  mfa_enrolled: z.boolean(),
  last_login_at: z.string().nullish(),
})

/** Step one. A correct password returns a challenge, never a session. */
export const loginChallengeSchema = z.object({
  mfa_token: z.string().min(1),
  expires_at: z.string(),
  enrollment_required: z.boolean(),
})

export const enrollmentStartSchema = z.object({
  secret: z.string().min(1),
  otpauth_uri: z.string().min(1),
  qr_svg: z.string().min(1),
})

/**
 * Both password-reset endpoints answer with the same shape: an acknowledgement
 * and nothing else. There is deliberately no token here — completing a reset
 * does not sign anyone in.
 */
export const passwordResetAckSchema = z.object({
  detail: z.string().min(1),
})

/** Step two, and every refresh. The refresh token is absent on purpose. */
export const sessionSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_at: z.string(),
  expires_in: z.number(),
  admin: adminProfileSchema,
  recovery_codes: z.array(z.string()).nullish(),
})

/** Domain types. */

export interface AdminProfile {
  id: string
  email: string
  fullName: string
  mfaEnrolled: boolean
  lastLoginAt: string | null
}

export interface Session {
  admin: AdminProfile
  token: string
  expiresAt: string
  /** Seconds, from the server. The browser clock is not trusted to subtract. */
  expiresIn: number
  /** Present exactly once, in the response that completes enrolment. */
  recoveryCodes: string[] | null
}

export interface LoginChallenge {
  mfaToken: string
  expiresAt: string
  enrollmentRequired: boolean
}

export interface Enrollment {
  secret: string
  otpauthUri: string
  qrSvg: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface MfaVerifyRequest {
  code: string
}

export interface RecoveryRequest {
  recoveryCode: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

/** What both reset endpoints return: a sentence, and never a credential. */
export interface PasswordResetAck {
  detail: string
}

export type LogoutReason = 'user-action' | 'session-expired'

/**
 * Which screen the sign-in flow is currently on.
 *
 * `forgot` belongs here rather than on a route of its own for the same reason
 * `verify` does: it is a step inside the sign-in screen, reached from it and
 * returning to it. `/reset-password` *is* a route, because the operator arrives
 * there from a link in their email rather than from this flow.
 */
export type AuthStage = 'credentials' | 'enroll' | 'verify' | 'recovery' | 'forgot'

export function toAdminProfile(raw: z.infer<typeof adminProfileSchema>): AdminProfile {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.full_name,
    mfaEnrolled: raw.mfa_enrolled,
    lastLoginAt: raw.last_login_at ?? null,
  }
}
