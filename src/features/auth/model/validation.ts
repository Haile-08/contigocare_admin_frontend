import { z } from 'zod'

import type { TFunction } from '@/shared/i18n'

/**
 * Client-side checks are for feedback only — the server enforces the real rule.
 *
 * The schemas are *built from* a `t` rather than declared at module load: a
 * validation message is UI text, and a schema frozen at import time would
 * answer in whatever language the app started in. Each form builds its schema
 * once per locale (`useMemo`), so switching language re-labels the errors too.
 *
 * There is no registration schema. The password policy is the server's — stated
 * once in `utils/sanitization.py` and enforced by every path that sets a
 * password. `createPasswordResetSchema` restates the shape of it here so the
 * operator finds out their new password is too short before a round trip, not
 * after; the server checks it again regardless, and its answer wins.
 */

/** Mirrors `MIN_PASSWORD_LENGTH` in the backend's `utils/sanitization.py`. */
const MIN_PASSWORD_LENGTH = 12

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.email(t('validation.email')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export function createMfaSchema(t: TFunction) {
  return z.object({
    // Accepts the spaces some authenticator apps display, then strips them, so
    // pasting "123 456" is not an error the user has to understand.
    code: z
      .string()
      .transform((value) => value.replaceAll(/[\s-]/g, ''))
      .pipe(z.string().regex(/^\d{6}$/, t('validation.mfaCode'))),
  })
}

export function createRecoverySchema(t: TFunction) {
  return z.object({
    recoveryCode: z
      .string()
      .transform((value) => value.trim().toUpperCase())
      .pipe(z.string().min(8, t('validation.recoveryCode'))),
  })
}

export function createForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.email(t('validation.email')),
  })
}

export function createPasswordResetSchema(t: TFunction) {
  return z
    .object({
      // The password is never trimmed. A leading or trailing space is a
      // character the operator chose, and silently removing it here would set
      // a password they cannot then type.
      newPassword: z
        .string()
        .min(MIN_PASSWORD_LENGTH, t('validation.passwordLength', { min: MIN_PASSWORD_LENGTH }))
        .regex(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/, t('validation.passwordLetter'))
        .regex(/\d/, t('validation.passwordNumber')),
      confirmPassword: z.string(),
    })
    // Confirmation is a client-side concern only — the server is sent one
    // password and has no opinion about typos.
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
}
