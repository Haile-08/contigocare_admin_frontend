import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useAppDispatch } from '@/app/store/hooks'
import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'

import { useRequestPasswordResetMutation } from '../api/authApi'
import { stageChanged } from '../model/authSlice'
import { createForgotPasswordSchema } from '../model/validation'
import { AuthSteps } from './AuthSteps'

/**
 * "Email me a link."
 *
 * The confirmation deliberately says *if* an account exists. The server answers
 * identically for a real and an invented address — that is what stops this form
 * being a way to ask who works here — and a UI that said "sent!" would quietly
 * throw that away by implying the address was found.
 *
 * Laid out as the enrolment screen's sibling: the same numbered steps, the same
 * bordered plate, the same field-and-button column. Someone arriving here from
 * the sign-in screen should recognise the shape before they read a word.
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation()

  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)
  // The address the request actually went out for, so the confirmation names
  // what was sent rather than whatever is in the input a moment later.
  const [sentTo, setSentTo] = useState<string | null>(null)

  const schema = useMemo(() => createForgotPasswordSchema(t), [t])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFormError(null)

    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }

    setFieldError(undefined)

    try {
      await requestReset(parsed.data).unwrap()
      setSentTo(parsed.data.email)
    } catch (error) {
      // Only a transport failure or a rate limit reaches here — the endpoint
      // answers 202 for every address it is given.
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6.5">
        <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
          <div className="grid size-11 place-items-center rounded-full bg-surface-sunk text-muted">
            <Icon name="mail" className="size-5" />
          </div>

          <p className="text-center text-[13px] font-medium text-body">{t('forgot.sentTitle')}</p>

          <p className="text-center text-[12px] leading-relaxed text-muted">
            {t('forgot.sentBody', { email: sentTo })}
          </p>

          <p className="w-full rounded-xs border border-line-soft bg-surface px-3 py-2.5 text-[11.5px] leading-relaxed text-faint">
            {t('forgot.sentHint')}
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <Button
            onClick={() => dispatch(stageChanged('credentials'))}
            className="h-12 w-full text-[13px]"
          >
            {t('forgot.backToLogin')}
          </Button>

          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-[12.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
          >
            {t('forgot.resend')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6.5">
      <AuthSteps steps={['forgot.step1', 'forgot.step2', 'forgot.step3']} />

      {/* Where the enrolment screen puts its QR. There is nothing to scan, so
          the plate carries the one thing worth knowing before starting: a reset
          does not touch the second factor. */}
      <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
        <div className="grid size-11 place-items-center rounded-full bg-surface-sunk text-muted">
          <Icon name="shield" className="size-5" />
        </div>

        <p className="text-center text-[12px] leading-relaxed text-muted">{t('reset.mfaNote')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
        <Input
          label={t('field.email')}
          type="email"
          name="email"
          autoComplete="username"
          autoFocus
          required
          placeholder={t('field.emailPlaceholder')}
          wrapperClassName="gap-1.75"
          className="h-11.5 px-3.5"
          value={email}
          error={fieldError}
          onChange={(event) => setEmail(event.target.value)}
        />

        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <div className="flex flex-col gap-3.5">
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={email.length === 0}
            className="h-12 w-full text-[13px]"
          >
            {t('forgot.submit')}
          </Button>

          <button
            type="button"
            onClick={() => dispatch(stageChanged('credentials'))}
            className="text-[12.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
          >
            {t('forgot.backToLogin')}
          </button>
        </div>
      </form>
    </div>
  )
}
