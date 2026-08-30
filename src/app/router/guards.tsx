import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAppSelector } from '@/app/store/hooks'
import { selectIsAuthenticated } from '@/features/auth/model/authSlice'

import { paths } from './paths'

/**
 * Route guards.
 *
 * These are a *navigation* concern, not a security boundary — every protected
 * resource is enforced by the API, which validates the JWT on each request.
 * Their job is to keep a signed-out user from landing on a page that can only
 * fail, and to send a signed-in user back where they were headed.
 */

interface RedirectState {
  from?: string
}

export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

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
  const location = useLocation()

  if (isAuthenticated) {
    const state = location.state as RedirectState | null
    // Only ever resume to an in-app path: an attacker-supplied absolute URL
    // here would turn the login page into an open redirect.
    const from = state?.from
    const target = from && from.startsWith('/') && !from.startsWith('//') ? from : paths.dashboard
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
