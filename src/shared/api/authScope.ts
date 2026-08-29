/**
 * The API issues two different JWT scopes (see the backend's
 * `docs/authentication.md`):
 *
 * - `user`    — returned by register/login. Identifies the account; used to
 *               list and create chat sessions.
 * - `session` — returned per chat session. Required by every chat endpoint and
 *               by rename/delete, which reject a token belonging to a
 *               *different* session. Endpoints therefore pass the specific
 *               session's token explicitly rather than reading it from state.
 * - `public`  — no credentials (login, register, health).
 */
export type AuthScope = 'user' | 'session' | 'public'

/**
 * Attaches a session-scoped token to a single request.
 *
 * Spread into an endpoint's `query()` result:
 * `{ url, method: 'DELETE', ...withSessionToken(token) }`
 */
export function withSessionToken(token: string): { headers: Record<string, string> } {
  return { headers: { Authorization: `Bearer ${token}` } }
}
