import { env } from '@/shared/config/env'

/**
 * Thin logging seam. Application code never calls `console` directly, so
 * swapping in Sentry/Datadog later is a change to this file alone.
 *
 * Debug/info are dropped in production builds to avoid leaking request shapes,
 * ids, or token metadata into a user's console.
 */

type LogContext = Record<string, unknown>

const noop = (): void => {}

export const logger = {
  debug: env.isProduction ? noop : (message: string, context?: LogContext) => {
    console.debug(`[debug] ${message}`, context ?? '')
  },
  info: env.isProduction ? noop : (message: string, context?: LogContext) => {
    console.info(`[info] ${message}`, context ?? '')
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(`[warn] ${message}`, context ?? '')
  },
  error: (message: string, context?: LogContext) => {
    console.error(`[error] ${message}`, context ?? '')
  },
}

export type Logger = typeof logger
