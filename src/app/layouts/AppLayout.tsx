import { Outlet } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { loggedOut, selectAuthUser } from '@/features/auth/model/authSlice'
import { SessionSidebar } from '@/features/sessions/ui/SessionSidebar'
import { env } from '@/shared/config/env'
import { Button } from '@/shared/ui/Button'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-900">{env.appName}</span>

        <div className="flex items-center gap-3">
          {user ? (
            <span className="text-xs text-slate-500">{user.username ?? user.email}</span>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              dispatch(loggedOut('user-action'))
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <SessionSidebar />
        <Outlet />
      </div>
    </div>
  )
}
