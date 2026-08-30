import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { fieldErrorsFromZod } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'

import { useRegisterMutation } from '../api/authApi'
import { createRegisterSchema } from '../model/validation'
import { PasswordInput } from './PasswordInput'

export function RegisterForm() {
  const { t } = useTranslation()
  const [register, { isLoading }] = useRegisterMutation()
  const [values, setValues] = useState({ email: '', password: '', username: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const schema = useMemo(() => createRegisterSchema(t), [t])

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
      await register(parsed.data).unwrap()
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

        <Input
          label={t('field.displayName')}
          type="text"
          name="username"
          autoComplete="nickname"
          maxLength={50}
          hint={t('field.displayNameHint')}
          wrapperClassName="gap-1.75"
          className="h-11.5 px-3.5"
          value={values.username}
          error={fieldErrors['username']}
          onChange={(event) => {
            setValues((current) => ({ ...current, username: event.target.value }))
          }}
        />

        <PasswordInput
          label={t('field.password')}
          name="password"
          autoComplete="new-password"
          required
          hint={t('field.passwordHint')}
          value={values.password}
          error={fieldErrors['password']}
          onChange={(event) => {
            setValues((current) => ({ ...current, password: event.target.value }))
          }}
        />
      </div>

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <Button type="submit" isLoading={isLoading} className="h-12 w-full text-[13px]">
        {t('register.submit')}
      </Button>
    </form>
  )
}
