import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

import { en } from '@/shared/i18n/en'
import type { TranslationKey } from '@/shared/i18n/en'
import type { TFunction } from '@/shared/i18n/translate'

/**
 * Normalises everything RTK Query can hand back — transport failures, FastAPI
 * `{detail: ...}` bodies, Pydantic validation arrays, thrown exceptions — into
 * one shape components can render without type-narrowing at each call site.
 *
 * Two kinds of message come out of here, and only one of them is translatable:
 *
 *  - Ours — "could not reach the server", "too many attempts". These carry a
 *    `messageKey`, and a component with a `t` renders them in the user's
 *    language.
 *  - The server's — a FastAPI `detail`, a Pydantic field message. We did not
 *    write that string and cannot translate it, so it passes through verbatim
 *    with no key. Showing the API's own words is still better than replacing a
 *    specific explanation ("Incorrect email or password") with a generic one.
 */

export interface NormalizedApiError {
  /** HTTP status, or an RTK Query transport code such as `FETCH_ERROR`. */
  status: number | string
  /** Human-readable message safe to show to the user. English when it is ours. */
  message: string
  /** Set when the message is ours, so it can be translated. Absent for server text. */
  messageKey?: TranslationKey
  /** Field-level messages keyed by field name, from 422 validation responses. */
  fieldErrors?: Record<string, string>
}

interface FastApiValidationIssue {
  loc?: unknown[]
  msg?: string
}

const GENERIC_KEY = 'error.generic' satisfies TranslationKey

const TRANSPORT_KEYS: Record<string, TranslationKey> = {
  FETCH_ERROR: 'error.fetch',
  TIMEOUT_ERROR: 'error.timeout',
  PARSING_ERROR: 'error.parsing',
  CUSTOM_ERROR: GENERIC_KEY,
}

const STATUS_KEYS: Record<number, TranslationKey> = {
  400: 'error.badRequest',
  401: 'error.unauthorized',
  403: 'error.forbidden',
  404: 'error.notFound',
  409: 'error.conflict',
  429: 'error.tooMany',
}

/**
 * The English text for one of our keys. Read straight off the `en` dictionary
 * so there is one copy of every sentence — this module holds keys, not prose.
 */
function fallback(key: TranslationKey): string {
  const phrase = en[key]
  return typeof phrase === 'string' ? phrase : phrase.other
}

function ours(status: number | string, key: TranslationKey): NormalizedApiError {
  return { status, message: fallback(key), messageKey: key }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return isObject(error) && 'status' in error
}

/** Pulls the message out of a FastAPI `{ "detail": ... }` body. */
function parseDetail(
  data: unknown,
): Pick<NormalizedApiError, 'message' | 'messageKey' | 'fieldErrors'> | null {
  if (!isObject(data) || !('detail' in data)) return null

  const detail = data['detail']

  if (typeof detail === 'string') {
    return { message: detail }
  }

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}

    for (const raw of detail) {
      if (!isObject(raw)) continue
      const issue = raw as FastApiValidationIssue
      const message = typeof issue.msg === 'string' ? issue.msg : null
      if (!message) continue

      // `loc` looks like ["body", "password"] — the last segment is the field.
      const field = Array.isArray(issue.loc) ? issue.loc.at(-1) : undefined
      if (typeof field === 'string' && field !== 'body') {
        fieldErrors[field] = message
      }
    }

    const first = Object.values(fieldErrors)[0]

    return {
      // A field message is the server's; the summary, when there is none, is ours.
      ...(first
        ? { message: first }
        : {
            message: fallback('error.fieldsHighlighted'),
            messageKey: 'error.fieldsHighlighted' satisfies TranslationKey,
          }),
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    }
  }

  return null
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isFetchBaseQueryError(error)) {
    if (typeof error.status === 'number') {
      const parsed = parseDetail(error.data)
      if (parsed) return { status: error.status, ...parsed }

      return ours(error.status, STATUS_KEYS[error.status] ?? GENERIC_KEY)
    }

    return ours(error.status, TRANSPORT_KEYS[error.status] ?? GENERIC_KEY)
  }

  if (isObject(error) && ('message' in error || 'name' in error)) {
    const serialized = error as SerializedError
    if (serialized.message === undefined) {
      return ours(serialized.code ?? 'UNKNOWN_ERROR', GENERIC_KEY)
    }

    return { status: serialized.code ?? 'UNKNOWN_ERROR', message: serialized.message }
  }

  return ours('UNKNOWN_ERROR', GENERIC_KEY)
}

/**
 * Convenience for the common "just show me a string" case.
 *
 * Pass the `t` from `useTranslation()` to get our own messages in the user's
 * language; without one they come back in English.
 */
export function getApiErrorMessage(error: unknown, t?: TFunction): string {
  const { message, messageKey } = normalizeApiError(error)
  return messageKey && t ? t(messageKey) : message
}
