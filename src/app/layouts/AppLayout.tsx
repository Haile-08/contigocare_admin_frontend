import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { mobileNavToggled, selectMobileNavOpen } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { Spinner } from '@/shared/ui/Spinner'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center py-24 text-muted">
      <Spinner className="size-5" />
    </div>
  )
}

/**
 * The authenticated shell.
 *
 * Three details that matter:
 *
 *  - The shell fills the viewport and never scrolls. `<main>` is a sized box,
 *    not a growing one, so a screen can hand out that height however it likes —
 *    which is what lets the dashboard run a full-height ops rail beside a
 *    separately scrolling column, and the chat screen run its own list column.
 *    Screens that just want a page use `<Page>`, which owns the scrolling.
 *  - The error boundary and Suspense sit *inside* the shell, around `<Outlet/>`
 *    only. A crashing or loading screen therefore leaves the sidebar and topbar
 *    interactive, so the user can always navigate away.
 *  - The boundary is keyed on the pathname, so navigating away from a crashed
 *    screen resets it instead of leaving the error stuck on the next page.
 */
export function AppLayout() {
  const dispatch = useAppDispatch()
  const mobileNavOpen = useAppSelector(selectMobileNavOpen)
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Mobile: the same nav in an overlay drawer. */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t('topbar.closeNavigation')}
            onClick={() => dispatch(mobileNavToggled(false))}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative h-full w-sidebar">
            <Sidebar onNavigate={() => dispatch(mobileNavToggled(false))} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-surface">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
