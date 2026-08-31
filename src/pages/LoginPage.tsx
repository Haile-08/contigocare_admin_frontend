import { useEffect } from 'react'

import { AuthHeading } from '@/app/layouts/AuthLayout'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  logoutReasonCleared,
  selectAuthStage,
  selectLogoutReason,
  selectRecoveryCodes,
} from '@/features/auth/model/authSlice'
import { EnrollmentPanel } from '@/features/auth/ui/EnrollmentPanel'
import { ForgotPasswordForm } from '@/features/auth/ui/ForgotPasswordForm'
import { LoginForm } from '@/features/auth/ui/LoginForm'
import { MfaForm } from '@/features/auth/ui/MfaForm'
import { RecoveryCodesPanel } from '@/features/auth/ui/RecoveryCodesPanel'
import { RecoveryForm } from '@/features/auth/ui/RecoveryForm'
import type { AuthStage } from '@/features/auth/model/types'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'

/**
 * One screen, six stages.
 *
 * Which stage renders is read from the store rather than from a route: the
 * intermediate states are not addressable, and giving `/login/verify` a URL
 * would invite someone to bookmark a step that only exists while a five-minute
 * challenge token is alive. `/reset-password` is the one exception, and it is a
 * route precisely because it is reached from an email rather than from here.
 *
 * `recoveryCodes` is not an `AuthStage` in the store because nothing ever
 * *transitions* to it — it is a property of the session that just arrived, and
 * it outranks whatever stage the store holds. It used to render from the route
 * guard, outside this layout, which is why it was the one screen in the flow
 * with no heading and no frame around it.
 */

type Screen = AuthStage | 'recoveryCodes'

const HEADINGS: Record<Screen, { title: TranslationKey; subtitle: TranslationKey }> = {
  credentials: { title: 'login.title', subtitle: 'login.subtitle' },
  enroll: { title: 'enroll.title', subtitle: 'enroll.subtitle' },
  verify: { title: 'mfa.title', subtitle: 'mfa.subtitle' },
  recovery: { title: 'recovery.title', subtitle: 'recovery.subtitle' },
  forgot: { title: 'forgot.title', subtitle: 'forgot.subtitle' },
  recoveryCodes: { title: 'recoveryCodes.title', subtitle: 'recoveryCodes.subtitle' },
}

export function LoginPage() {
  const dispatch = useAppDispatch()
  const stage = useAppSelector(selectAuthStage)
  const recoveryCodes = useAppSelector(selectRecoveryCodes)
  const logoutReason = useAppSelector(selectLogoutReason)
  const { t } = useTranslation()

  // Explain an expiry once, then forget it so it does not reappear later.
  useEffect(() => {
    return () => {
      dispatch(logoutReasonCleared())
    }
  }, [dispatch])

  const hasCodes = Boolean(recoveryCodes && recoveryCodes.length > 0)
  const screen: Screen = hasCodes ? 'recoveryCodes' : stage
  const heading = HEADINGS[screen]

  return (
    <>
      <AuthHeading title={t(heading.title)}>{t(heading.subtitle)}</AuthHeading>

      {screen === 'credentials' && logoutReason === 'session-expired' ? (
        <Alert tone="info">{t('login.sessionExpired')}</Alert>
      ) : null}

      {screen === 'credentials' ? <LoginForm /> : null}
      {screen === 'enroll' ? <EnrollmentPanel /> : null}
      {screen === 'verify' ? <MfaForm /> : null}
      {screen === 'recovery' ? <RecoveryForm /> : null}
      {screen === 'forgot' ? <ForgotPasswordForm /> : null}
      {screen === 'recoveryCodes' && recoveryCodes ? (
        <RecoveryCodesPanel codes={recoveryCodes} />
      ) : null}

      {screen === 'credentials' ? (
        <p className="text-[11.5px] leading-relaxed text-faint">{t('login.note')}</p>
      ) : null}
    </>
  )
}

export default LoginPage
