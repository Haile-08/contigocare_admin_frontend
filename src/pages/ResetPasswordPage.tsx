import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthHeading } from '@/app/layouts/AuthLayout'
import { paths } from '@/app/router/paths'
import { ResetPasswordForm } from '@/features/auth/ui/ResetPasswordForm'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'

/**
 * The only auth screen with a URL of its own.
 *
 * Every other step of signing in is a stage inside `/login`, because those
 * states only exist while a five-minute challenge is alive and a bookmark to
 * one would be a bookmark to nothing. This one is different: the operator
 * arrives from a link in their email, which means the address has to carry the
 * token and has to survive being pasted into a fresh browser.
 *
 * The token is read from the query string and never written anywhere else — not
 * to storage, not into the store. It lives in this component's props for the
 * length of one form submission.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)

  const token = searchParams.get('token') ?? ''

  const goToLogin = (): void => {
    void navigate(paths.login, { replace: true })
  }

  if (done) {
    return (
      <>
        <AuthHeading title={t('reset.doneTitle')} />

        <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
          <div className="grid size-11 place-items-center rounded-full bg-surface-sunk text-muted">
            <Icon name="check" className="size-5" />
          </div>

          <p className="text-center text-[12px] leading-relaxed text-muted">
            {t('reset.doneBody')}
          </p>
        </div>

        <Button onClick={goToLogin} className="h-12 w-full text-[13px]">
          {t('reset.goToLogin')}
        </Button>
      </>
    )
  }

  // A link truncated by a mail client is the common way to land here without a
  // token. Saying so beats letting the form submit an empty string and relaying
  // the server's "invalid link" a round trip later.
  if (!token) {
    return (
      <>
        <AuthHeading title={t('reset.title')}>{t('reset.subtitle')}</AuthHeading>

        <Alert tone="error">{t('reset.missingToken')}</Alert>

        <Button variant="secondary" onClick={goToLogin} className="h-10 w-full text-[13px]">
          {t('forgot.backToLogin')}
        </Button>
      </>
    )
  }

  return (
    <>
      <AuthHeading title={t('reset.title')}>{t('reset.subtitle')}</AuthHeading>

      <ResetPasswordForm token={token} onDone={() => setDone(true)} />
    </>
  )
}

export default ResetPasswordPage
