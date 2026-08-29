import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

/**
 * Normalises everything RTK Query can hand back — transport failures, FastAPI
 * `{detail: ...}` bodies, Pydantic validation arrays, thrown exceptions — into
 * one shape components can render without type-narrowing at each call site.
 */

export interface NormalizedApiError {
  /** HTTP status, or an RTK Query transport code such as `FETCH_ERROR`. */
  status: number | string
  /** Human-readable message safe to show to the user. */
  message: string
  /** Field-level messages keyed by field name, from 422 validation responses. */
  fieldErrors?: Record<string, string>
}

interface FastApiValidationIssue {
  loc?: unknown[]
  msg?: string
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

const TRANSPORT_MESSAGES: Record<string, string> = {
  FETCH_ERROR: 'Could not reach the server. Check your connection and try again.',
  TIMEOUT_ERROR: 'The server took too long to respond. Please try again.',
  PARSING_ERROR: 'The server returned an unexpected response.',
  CUSTOM_ERROR: GENERIC_MESSAGE,
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was rejected. Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That conflicts with something that already exists.',
  429: 'Too many attempts. Please wait a moment and try again.',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return isObject(error) && 'status' in error
}

/** Pulls the message out of a FastAPI `{ "detail": ... }` body. */
function parseDetail(data: unknown): Pick<NormalizedApiError, 'message' | 'fieldErrors'> | null {
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
      message: first ?? 'Please correct the highlighted fields.',
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    }
  }

  return null
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isFetchBaseQueryError(error)) {
    if (typeof error.status === 'number') {
      const parsed = parseDetail(error.data)
      return {
        status: error.status,
        message: parsed?.message ?? STATUS_MESSAGES[error.status] ?? GENERIC_MESSAGE,
        ...(parsed?.fieldErrors ? { fieldErrors: parsed.fieldErrors } : {}),
      }
    }

    return {
      status: error.status,
      message: TRANSPORT_MESSAGES[error.status] ?? GENERIC_MESSAGE,
    }
  }

  if (isObject(error) && ('message' in error || 'name' in error)) {
    const serialized = error as SerializedError
    return {
      status: serialized.code ?? 'UNKNOWN_ERROR',
      message: serialized.message ?? GENERIC_MESSAGE,
    }
  }

  return { status: 'UNKNOWN_ERROR', message: GENERIC_MESSAGE }
}

/** Convenience for the common "just show me a string" case. */
export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message
}
