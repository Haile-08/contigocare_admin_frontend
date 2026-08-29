import { Outlet } from 'react-router-dom'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'

/**
 * Wraps every route in an error boundary that is *inside* the router, so a
 * crash in one screen can be recovered from by navigating away — the app-level
 * boundary in `App` only catches what escapes this one.
 */
export function RootLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}
