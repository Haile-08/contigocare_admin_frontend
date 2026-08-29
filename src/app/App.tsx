import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

import { router } from './router/router'
import { store } from './store'

/**
 * Composition root: the store, the router, and a last-resort error boundary.
 * Everything else is reached through routes.
 */
export function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </Provider>
  )
}
