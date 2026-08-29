import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner'

import { RequireAnonymous, RequireAuth } from './guards'
import { paths } from './paths'
import { RouteErrorPage } from './RouteErrorPage'

/**
 * Pages are loaded with `lazy` so each route is its own chunk: the login
 * screen does not ship the chat feature, and the app keeps a small initial
 * bundle as more sections are added.
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
              { index: true, element: <Navigate to={paths.chat} replace /> },
              {
                path: 'chat',
                lazy: async () => ({
                  Component: (await import('@/pages/ChatIndexPage')).ChatIndexPage,
                }),
              },
              {
                path: 'chat/:sessionId',
                lazy: async () => ({
                  Component: (await import('@/pages/ChatSessionPage')).ChatSessionPage,
                }),
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
