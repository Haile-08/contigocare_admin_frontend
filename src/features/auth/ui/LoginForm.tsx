import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useAppDispatch } from '@/app/store/hooks'
import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { fieldErrorsFromZod } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'

import { useLoginMutation } from '../api/authApi'
import { stageChanged } from '../model/authSlice'
import { createLoginSchema } from '../model/validation'
import { PasswordInput } from './PasswordInput'

/**
 * On success the auth state flips and the route guard redirects — no
 * imperative `navigate()` here, so there is exactly one place that decides
 * where a signed-in user belongs.
 */
export function LoginForm() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  // Rebuilt only when the language changes; `t` is stable per locale.
  const schema = useMemo(() => createLoginSchema(t), [t])

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
      await login(parsed.data).unwrap()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
      if (normalized.fieldErrors) setFieldErrors(normalized.fieldErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
      <div className="flex flex-col gap-4">
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
          value={values.email}
          error={fieldErrors['email']}
          onChange={(event) => {
            setValues((current) => ({ ...current, email: event.target.value }))
          }}
        />

        <PasswordInput
          label={t('field.password')}
          name="password"
          autoComplete="current-password"
          required
          value={values.password}
          error={fieldErrors['password']}
          onChange={(event) => {
            setValues((current) => ({ ...current, password: event.target.value }))
          }}
        />
      </div>

      {/* Credential failures are shown here rather than as a toast — the error
          belongs next to the form that produced it. */}
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="flex flex-col gap-3.5">
        <Button type="submit" isLoading={isLoading} className="h-12 w-full text-[13px]">
          {t('login.submit')}
        </Button>

        {/* A stage change, not a link: the reset request happens on this screen
            and comes back to it, so there is no URL worth minting for it. */}
        <button
          type="button"
          onClick={() => dispatch(stageChanged('forgot'))}
          className="text-[12.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
        >
          {t('forgot.link')}
        </button>
      </div>
    </form>
  )
}
