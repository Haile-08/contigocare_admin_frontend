import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAppSelector } from '@/app/store/hooks'
import {
  selectBootstrapping,
  selectIsAuthenticated,
  selectRecoveryCodes,
} from '@/features/auth/model/authSlice'
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner'

import { paths } from './paths'

/**
 * Route guards.
 *
 * These are a *navigation* concern, not a security boundary — every protected
 * resource is enforced by the API, which validates the access token on each
 * request. Their job is to keep a signed-out user from landing on a page that
 * can only fail, and to send a signed-in user back where they were headed.
 */

interface RedirectState {
  from?: string
}

export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const bootstrapping = useAppSelector(selectBootstrapping)
  const location = useLocation()

  // The session is re-established from an HttpOnly cookie on startup, which is
  // a round trip. Redirecting during it would bounce a signed-in operator to
  // the login screen on every hard refresh.
  if (bootstrapping) return <FullPageSpinner />

  if (!isAuthenticated) {
    return (
      <Navigate
        to={paths.login}
        replace
        state={{ from: `${location.pathname}${location.search}` } satisfies RedirectState}
      />
    )
  }

  return <Outlet />
}

export function RequireAnonymous() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const bootstrapping = useAppSelector(selectBootstrapping)
  const recoveryCodes = useAppSelector(selectRecoveryCodes)
  const location = useLocation()

  if (bootstrapping) return <FullPageSpinner />

  if (isAuthenticated) {
    // Enrolment just finished and the codes have not been acknowledged. They
    // are shown once and never again, so the redirect waits — otherwise the
    // operator lands on the dashboard having lost their only copy.
    //
    // Falling through to the outlet rather than rendering the panel here: this
    // guard sits *outside* `AuthLayout`, so returning a component from it put
    // the codes on a bare white page with no brand panel, no heading and no
    // width constraint — the one screen in the flow that looked like a
    // different application. The login route renders it instead, inside the
    // same frame as the QR screen it follows — so anywhere else under this
    // guard is sent there first.
    if (recoveryCodes && recoveryCodes.length > 0) {
      return location.pathname === paths.login ? <Outlet /> : <Navigate to={paths.login} replace />
    }

    const state = location.state as RedirectState | null
    // Only ever resume to an in-app path: an attacker-supplied absolute URL
    // here would turn the login page into an open redirect.
    const from = state?.from
    const target = from && from.startsWith('/') && !from.startsWith('//') ? from : paths.dashboard
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
