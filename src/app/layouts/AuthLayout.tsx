import { Outlet } from 'react-router-dom'

import { env } from '@/shared/config/env'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold text-slate-900">{env.appName}</p>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
