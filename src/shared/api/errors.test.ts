import { describe, expect, it } from 'vitest'

import { normalizeApiError } from './errors'

describe('normalizeApiError', () => {
  it('uses the API detail string when there is one', () => {
    const result = normalizeApiError({
      status: 401,
      data: { detail: 'Incorrect email or password' },
    })

    expect(result).toEqual({ status: 401, message: 'Incorrect email or password' })
  })

  it('maps FastAPI validation issues onto their fields', () => {
    const result = normalizeApiError({
      status: 422,
      data: {
        detail: [
          { loc: ['body', 'password'], msg: 'Password must contain at least one number' },
          { loc: ['body', 'email'], msg: 'value is not a valid email address' },
        ],
      },
    })

    expect(result.fieldErrors).toEqual({
      password: 'Password must contain at least one number',
      email: 'value is not a valid email address',
    })
    expect(result.message).toBe('Password must contain at least one number')
  })

  it('falls back to a status message when the body has no detail', () => {
    expect(normalizeApiError({ status: 429, data: null }).message).toContain('Too many attempts')
  })

  it('explains transport failures in plain language', () => {
    expect(normalizeApiError({ status: 'FETCH_ERROR', error: 'boom' }).message).toContain(
      'Could not reach the server',
    )
  })

  it('never leaks an unrecognised shape to the user', () => {
    expect(normalizeApiError(Symbol('weird')).message).toBe(
      'Something went wrong. Please try again.',
    )
  })
})
