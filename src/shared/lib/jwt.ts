/**
 * Reads the claims out of a JWT **without verifying it**.
 *
 * The signature can only be checked by the backend, which does so on every
 * request. Claims read here are used for convenience only (showing the account
 * id, expiring a token early client-side) and must never gate anything that
 * matters — always let the API be the authority.
 */

export interface JwtClaims {
  sub?: string
  exp?: number
  jti?: string
}

function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0)
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  const json = decodeBase64Url(payload)
  if (!json) return null

  try {
    const claims: unknown = JSON.parse(json)
    return typeof claims === 'object' && claims !== null ? (claims as JwtClaims) : null
  } catch {
    return null
  }
}

/** True when the token's own `exp` claim is in the past (or missing). */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtClaims(token)?.exp
  if (typeof exp !== 'number') return false
  return exp * 1000 <= Date.now() + skewSeconds * 1000
}
