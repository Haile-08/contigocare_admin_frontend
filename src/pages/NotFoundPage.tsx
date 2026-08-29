import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm font-medium text-slate-400">404</p>
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <Link to={paths.root} className="mt-2 text-sm text-brand-700 hover:underline">
        Go back home
      </Link>
    </main>
  )
}

export default NotFoundPage
