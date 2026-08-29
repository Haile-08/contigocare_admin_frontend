import { z } from 'zod'

/**
 * Runtime-validated environment.
 *
 * Vite inlines `import.meta.env.*` at build time, so a typo in a variable name
 * silently becomes `undefined` and surfaces as a confusing runtime bug. Parsing
 * the values once, here, turns that into a loud failure at startup instead.
 *
 * Never read `import.meta.env` outside this module.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1')

const isProduction = import.meta.env.PROD

const envSchema = z.object({
  apiBaseUrl: z
    .string()
    .min(1)
    .refine(
      (value) => !isProduction || value.startsWith('/') || value.startsWith('https://'),
      'must be origin-relative or https:// in a production build',
    ),
  appName: z.string().min(1),
  enableDevtools: booleanish,
  requestTimeoutMs: z.coerce.number().int().positive().max(120_000),
  tokenStorage: z.enum(['session', 'memory']),
})

const parsed = envSchema.safeParse({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'ContigoCare Admin',
  // DevTools expose the whole store (including tokens) to any page extension.
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS ?? (isProduction ? 'false' : 'true'),
  requestTimeoutMs: import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '30000',
  tokenStorage: import.meta.env.VITE_TOKEN_STORAGE ?? 'session',
})

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  VITE_${toEnvKey(issue.path.join('.'))}: ${issue.message}`)
    .join('\n')

  throw new Error(`Invalid environment configuration:\n${issues}`)
}

function toEnvKey(camelCaseKey: string): string {
  return camelCaseKey.replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction,
  isDevelopment: import.meta.env.DEV,
})

export type Env = typeof env
