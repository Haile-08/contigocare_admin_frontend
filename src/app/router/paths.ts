/**
 * Every route in one place. Components link through these helpers rather than
 * hand-written strings, so a URL change is a single edit and typos become
 * type errors.
 *
 * There is no `register` path. Accounts are created by an administrator running
 * `scripts/create_admin.py` against the database, and a route that does not
 * exist is a stronger statement than a route that 404s.
 */
export const paths = {
  root: '/',
  login: '/login',
  /**
   * Reached from a link in an email, never from a link in the app — which is
   * why it is a route at all while the rest of the sign-in flow is stages
   * inside `/login`. The single-use token arrives as a `?token=` parameter.
   *
   * Must match `PASSWORD_RESET_PATH` on the API, which is what builds the link.
   */
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  /** The policy list — the entry point for everything analysis-related. */
  policies: '/policies',
  /**
   * There is no path for the analysis wizard. It is a drawer over the current
   * screen, not a destination, so it has no URL to link to — `/policies/new`
   * survives only as a redirect for old bookmarks.
   */
  /** One stored policy: its redacted text, its analysis, and its verdict. */
  policy: (analysisId: string): string => `/policies/${encodeURIComponent(analysisId)}`,
} as const
