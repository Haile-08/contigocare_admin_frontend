import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { AuthHeading } from '@/app/layouts/AuthLayout'
import { paths } from '@/app/router/paths'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { logoutReasonCleared, selectLogoutReason } from '@/features/auth/model/authSlice'
import { LoginForm } from '@/features/auth/ui/LoginForm'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const logoutReason = useAppSelector(selectLogoutReason)
  const { t } = useTranslation()

  // Explain an expiry once, then forget it so it does not reappear later.
  useEffect(() => {
    return () => {
      dispatch(logoutReasonCleared())
    }
  }, [dispatch])

  return (
    <>
      <AuthHeading title={t('login.title')}>{t('login.subtitle')}</AuthHeading>

      {logoutReason === 'session-expired' ? (
        <Alert tone="info">{t('login.sessionExpired')}</Alert>
      ) : null}

      <LoginForm />

      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-muted">
          {t('login.noAccount')}{' '}
          <Link
            to={paths.register}
            className="border-b border-line-strong font-medium text-body transition-colors hover:border-ink hover:text-ink"
          >
            {t('login.createOne')}
          </Link>
        </p>

        <p className="text-[11.5px] leading-relaxed text-faint">{t('login.note')}</p>
      </div>
    </>
  )
}

export default LoginPage
