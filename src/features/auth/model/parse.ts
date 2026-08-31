import type { LoginChallenge, Enrollment, PasswordResetAck, Session } from './types'
import {
  enrollmentStartSchema,
  loginChallengeSchema,
  passwordResetAckSchema,
  sessionSchema,
  toAdminProfile,
} from './types'

/**
 * Wire-shape parsers, kept in their own module.
 *
 * `baseQuery` needs `parseSession` for the silent refresh, and importing it
 * from `authApi` would pull the whole API slice into the transport layer — a
 * cycle. Parsing lives here so both sides can reach it without either
 * depending on the other.
 */

export function parseSession(raw: unknown): Session {
  const data = sessionSchema.parse(raw)
  return {
    admin: toAdminProfile(data.admin),
    token: data.access_token,
    expiresAt: data.expires_at,
    expiresIn: data.expires_in,
    recoveryCodes: data.recovery_codes ?? null,
  }
}

export function parseChallenge(raw: unknown): LoginChallenge {
  const data = loginChallengeSchema.parse(raw)
  return {
    mfaToken: data.mfa_token,
    expiresAt: data.expires_at,
    enrollmentRequired: data.enrollment_required,
  }
}

export function parsePasswordResetAck(raw: unknown): PasswordResetAck {
  return passwordResetAckSchema.parse(raw)
}

export function parseEnrollment(raw: unknown): Enrollment {
  const data = enrollmentStartSchema.parse(raw)
  return {
    secret: data.secret,
    otpauthUri: data.otpauth_uri,
    qrSvg: data.qr_svg,
  }
}
