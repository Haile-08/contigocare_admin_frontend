import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

import { Localized } from './providers/Localized'
import { router } from './router/router'
import { store } from './store'

/**
 * Composition root: the store, the language, the router, and a last-resort
 * error boundary. Everything else is reached through routes.
 *
 * The boundary sits *inside* `Localized` so even the crash screen is in the
 * user's language.
 */
export function App() {
  return (
    <Provider store={store}>
      <Localized>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </Localized>
    </Provider>
  )
}
