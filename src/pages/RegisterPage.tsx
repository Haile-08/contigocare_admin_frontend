import { Link } from 'react-router-dom'

import { AuthHeading } from '@/app/layouts/AuthLayout'
import { paths } from '@/app/router/paths'
import { RegisterForm } from '@/features/auth/ui/RegisterForm'
import { useTranslation } from '@/shared/i18n'

export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <>
      <AuthHeading title={t('register.title')}>{t('register.subtitle')}</AuthHeading>

      <RegisterForm />

      <p className="text-[13px] text-muted">
        {t('register.haveAccount')}{' '}
        <Link
          to={paths.login}
          className="border-b border-line-strong font-medium text-body transition-colors hover:border-ink hover:text-ink"
        >
          {t('register.signIn')}
        </Link>
      </p>
    </>
  )
}

export default RegisterPage
