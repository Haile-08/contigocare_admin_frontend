/**
 * Every route in one place. Components link through these helpers rather than
 * hand-written strings, so a URL change is a single edit and typos become
 * type errors.
 */
export const paths = {
  root: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  chat: '/chat',
  chatSession: (sessionId: string) => `/chat/${encodeURIComponent(sessionId)}`,
} as const
