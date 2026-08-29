import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { logoutReasonCleared, selectLogoutReason } from '@/features/auth/model/authSlice'
import { LoginForm } from '@/features/auth/ui/LoginForm'
import { Alert } from '@/shared/ui/Alert'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const logoutReason = useAppSelector(selectLogoutReason)

  // Explain an expiry once, then forget it so it does not reappear later.
  useEffect(() => {
    return () => {
      dispatch(logoutReasonCleared())
    }
  }, [dispatch])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Use your ContigoCare account.</p>
      </div>

      {logoutReason === 'session-expired' ? (
        <Alert tone="info">Your session expired. Please sign in again.</Alert>
      ) : null}

      <LoginForm />

      <p className="text-center text-sm text-slate-500">
        No account?{' '}
        <Link to={paths.register} className="font-medium text-brand-700 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
