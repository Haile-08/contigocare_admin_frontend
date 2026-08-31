/**
 * Which credential an endpoint needs.
 *
 * - `user`   — the access token from the store. The default, and what every
 *              analysis and dashboard endpoint uses.
 * - `mfa`    — the short-lived challenge token issued between password and TOTP.
 *              Only the MFA endpoints accept it, and it can reach nothing else.
 * - `public` — no credential: login, and the refresh call (which authenticates
 *              with the HttpOnly cookie the browser attaches by itself).
 */
export type AuthScope = 'user' | 'mfa' | 'public'

const CSRF_COOKIE_NAME = 'cc_csrf'

/**
 * Reads the double-submit CSRF token the API set.
 *
 * Deliberately readable by script — that is the mechanism. The refresh cookie
 * is HttpOnly and travels on its own; this value proves the request came from a
 * page on our origin, since only same-origin script can read the cookie to
 * echo it back in a header.
 */
export function readCsrfToken(): string | null {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`))

  if (!match) return null

  const value = match.slice(CSRF_COOKIE_NAME.length + 1)
  return value.length > 0 ? decodeURIComponent(value) : null
}
