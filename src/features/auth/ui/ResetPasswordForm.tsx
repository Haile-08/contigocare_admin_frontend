import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { fieldErrorsFromZod } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'

import { useResetPasswordMutation } from '../api/authApi'
import { createPasswordResetSchema } from '../model/validation'
import { AuthSteps } from './AuthSteps'
import { PasswordInput } from './PasswordInput'

interface ResetPasswordFormProps {
  /** The token from the emailed link's query string. */
  token: string
  /** Called once the password has actually changed. */
  onDone: () => void
}

/**
 * The second half of a reset, reached from a link in an email.
 *
 * On success this does *not* sign anyone in — there is no session in the
 * response to sign them in with. The operator is handed back to the login
 * screen and completes both factors from the top, which is the property that
 * keeps a compromised mailbox from being a compromised account. A form that
 * "helpfully" logged them in here would silently delete that.
 */
export function ResetPasswordForm({ token, onDone }: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const [values, setValues] = useState({ newPassword: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const schema = useMemo(() => createPasswordResetSchema(t), [t])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFormError(null)

    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error))
      return
    }

    setFieldErrors({})

    try {
      await resetPassword({ token, newPassword: parsed.data.newPassword }).unwrap()
      onDone()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
      // The passwords are cleared but the token is not retried automatically:
      // a rejected token stays rejected, and the message says to ask for a new
      // link rather than inviting another attempt at this one.
      setValues({ newPassword: '', confirmPassword: '' })
    }
  }

  return (
    <div className="flex flex-col gap-6.5">
      <AuthSteps steps={['reset.step1', 'reset.step2', 'reset.step3']} />

      <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
        <div className="grid size-11 place-items-center rounded-full bg-surface-sunk text-muted">
          <Icon name="key" className="size-5" />
        </div>

        <p className="text-center text-[12px] leading-relaxed text-muted">{t('reset.mfaNote')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
        <div className="flex flex-col gap-4">
          <PasswordInput
            label={t('reset.newPassword')}
            hint={t('reset.passwordHint')}
            name="new-password"
            autoComplete="new-password"
            autoFocus
            required
            value={values.newPassword}
            error={fieldErrors['newPassword']}
            onChange={(event) => {
              setValues((current) => ({ ...current, newPassword: event.target.value }))
            }}
          />

          <PasswordInput
            label={t('reset.confirmPassword')}
            name="confirm-password"
            autoComplete="new-password"
            required
            value={values.confirmPassword}
            error={fieldErrors['confirmPassword']}
            onChange={(event) => {
              setValues((current) => ({ ...current, confirmPassword: event.target.value }))
            }}
          />
        </div>

        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={values.newPassword.length === 0 || values.confirmPassword.length === 0}
          className="h-12 w-full text-[13px]"
        >
          {t('reset.submit')}
        </Button>
      </form>
    </div>
  )
}
