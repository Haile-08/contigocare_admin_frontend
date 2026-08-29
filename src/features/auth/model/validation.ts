import { z } from 'zod'

/**
 * Mirrors the backend's password policy (`app/schemas/auth.py`).
 *
 * Client-side checks are for feedback only — the server enforces the real
 * rule. Keeping the two in sync means a user learns about a weak password
 * before a round trip, not after.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(64, 'Use at most 64 characters')
  .refine((value) => /[A-Z]/.test(value), 'Add an uppercase letter')
  .refine((value) => /[a-z]/.test(value), 'Add a lowercase letter')
  .refine((value) => /\d/.test(value), 'Add a number')
  .refine(
    (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    'Add a special character (for example !, ? or @)',
  )

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: passwordSchema,
  username: z
    .string()
    .max(50, 'Use at most 50 characters')
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
})

export const PASSWORD_HINT =
  '8+ characters with an uppercase letter, a lowercase letter, a number and a special character.'
