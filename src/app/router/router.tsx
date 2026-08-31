import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import type { RouteHandle } from '@/app/layouts/Breadcrumbs'
import { RootLayout } from '@/app/layouts/RootLayout'
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner'

import { RequireAnonymous, RequireAuth } from './guards'
import { paths } from './paths'
import { RouteErrorPage } from './RouteErrorPage'

/**
 * The dashboard, the policy list and what hangs off it, and the sign-in.
 *
 * Pages are loaded with `lazy` so each route is its own chunk: the login screen
 * does not ship the analysis feature. The wizard is not among them — it opens
 * in a drawer over whatever screen is showing rather than on a route of its
 * own, and does its own code-splitting from there.
 *
 * `handle.crumb` is what the topbar's breadcrumb trail reads, so a route's
 * label is declared with the route rather than passed down through the tree.
 */
export const router = createBrowserRouter([
  {
    path: paths.root,
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    HydrateFallback: FullPageSpinner,
    children: [
      {
        element: <RequireAnonymous />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: 'login',
                lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
              },
              // A real route, unlike the other sign-in steps: the operator
              // arrives here from a link in their email, so the token has to
              // live in the URL and the URL has to work in a fresh browser.
              {
                path: 'reset-password',
                lazy: async () => ({
                  Component: (await import('@/pages/ResetPasswordPage')).ResetPasswordPage,
                }),
              },
            ],
          },
        ],
      },

      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to={paths.dashboard} replace /> },
              {
                path: 'dashboard',
                handle: { crumb: 'nav.dashboard' } satisfies RouteHandle,
                lazy: async () => ({
                  Component: (await import('@/pages/DashboardPage')).DashboardPage,
                }),
              },
              {
                path: 'policies',
                handle: { crumb: 'nav.policies' } satisfies RouteHandle,
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('@/pages/PoliciesPage')).PoliciesPage,
                    }),
                  },
                  // The wizard used to be a screen at /policies/new. It is now
                  // a drawer opened from the rail, so this is a redirect for
                  // anyone holding the old URL rather than a route.
                  { path: 'new', element: <Navigate to={paths.policies} replace /> },
                  {
                    // The crumb is static because the patient id is not known
                    // until the analysis loads, and a trail that appears a beat
                    // after the page does is worse than one that never moves.
                    path: ':analysisId',
                    handle: { crumb: 'policies.detailCrumb' } satisfies RouteHandle,
                    lazy: async () => ({
                      Component: (await import('@/pages/PolicyDetailPage')).PolicyDetailPage,
                    }),
                  },
                ],
              },
              // The screen used to live at /analysis. Anyone with that URL
              // bookmarked lands on the list rather than a 404.
              { path: 'analysis', element: <Navigate to={paths.policies} replace /> },
            ],
          },
        ],
      },

      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
])
