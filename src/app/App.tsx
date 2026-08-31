import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import { useBootstrapSessionMutation } from '@/features/auth/api/authApi'
import { bootstrapFinished } from '@/features/auth/model/authSlice'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

import { Localized } from './providers/Localized'
import { router } from './router/router'
import { store } from './store'
import { useAppDispatch } from './store/hooks'

/**
 * Re-establishes the session on load.
 *
 * The access token is never persisted, so on a fresh page load the app knows
 * nothing. What it does have is the HttpOnly refresh cookie, which the browser
 * attaches by itself — so one call to `/auth/refresh` answers "is there a live
 * session here?" without any credential having been written to storage.
 *
 * Until that call settles, `auth.bootstrapping` is true and the route guards
 * hold. Otherwise every hard refresh would flash the login screen before
 * redirecting back.
 */
function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const [bootstrap] = useBootstrapSessionMutation()

  useEffect(() => {
    let cancelled = false

    void bootstrap()
      .unwrap()
      .catch(() => {
        // No resumable session — the common case on a first visit, and not an
        // error worth surfacing.
      })
      .finally(() => {
        // On success the slice already left `bootstrapping` false; this covers
        // the failure path so the guards stop waiting either way.
        if (!cancelled) dispatch(bootstrapFinished())
      })

    return () => {
      cancelled = true
    }
  }, [bootstrap, dispatch])

  return <>{children}</>
}

/**
 * Composition root: the store, the language, the session, the router, and a
 * last-resort error boundary. Everything else is reached through routes.
 *
 * The boundary sits *inside* `Localized` so even the crash screen is in the
 * user's language.
 */
export function App() {
  return (
    <Provider store={store}>
      <Localized>
        <ErrorBoundary>
          <SessionBootstrap>
            <RouterProvider router={router} />
          </SessionBootstrap>
        </ErrorBoundary>
      </Localized>
    </Provider>
  )
}
