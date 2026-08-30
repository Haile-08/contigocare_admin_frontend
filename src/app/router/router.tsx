import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import type { RouteHandle } from '@/app/layouts/Breadcrumbs'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ChatLayout } from '@/app/layouts/ChatLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner'

import { RequireAnonymous, RequireAuth } from './guards'
import { paths } from './paths'
import { RouteErrorPage } from './RouteErrorPage'

/**
 * Pages are loaded with `lazy` so each route is its own chunk: the login
 * screen does not ship the chat feature or the charting library, and the app
 * keeps a small initial bundle as more sections are added.
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
              {
                path: 'register',
                lazy: async () => ({
                  Component: (await import('@/pages/RegisterPage')).RegisterPage,
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
                path: 'chat',
                handle: { crumb: 'nav.conversations' } satisfies RouteHandle,
                element: <ChatLayout />,
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('@/pages/ChatIndexPage')).ChatIndexPage,
                    }),
                  },
                  {
                    path: ':sessionId',
                    lazy: async () => ({
                      Component: (await import('@/pages/ChatSessionPage')).ChatSessionPage,
                    }),
                  },
                ],
              },
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
