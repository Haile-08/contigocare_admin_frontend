import { z } from 'zod'

import type { TFunction } from '@/shared/i18n'

/**
 * Mirrors the backend's password policy (`app/schemas/auth.py`).
 *
 * Client-side checks are for feedback only — the server enforces the real
 * rule. Keeping the two in sync means a user learns about a weak password
 * before a round trip, not after.
 *
 * The schemas are *built from* a `t` rather than declared at module load: a
 * validation message is UI text, and a schema frozen at import time would
 * answer in whatever language the app started in. Each form builds its schema
 * once per locale (`useMemo`), so switching language re-labels the errors too.
 */

export function createPasswordSchema(t: TFunction) {
  return z
    .string()
    .min(8, t('validation.passwordMin'))
    .max(64, t('validation.passwordMax'))
    .refine((value) => /[A-Z]/.test(value), t('validation.passwordUppercase'))
    .refine((value) => /[a-z]/.test(value), t('validation.passwordLowercase'))
    .refine((value) => /\d/.test(value), t('validation.passwordNumber'))
    .refine(
      (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
      t('validation.passwordSpecial'),
    )
}

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.email(t('validation.email')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export function createRegisterSchema(t: TFunction) {
  return z.object({
    email: z.email(t('validation.email')),
    password: createPasswordSchema(t),
    username: z
      .string()
      .max(50, t('validation.nameMax'))
      .optional()
      .transform((value) => (value?.trim() ? value.trim() : undefined)),
  })
}
