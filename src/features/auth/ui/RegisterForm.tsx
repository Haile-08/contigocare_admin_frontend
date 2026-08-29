import { useState } from 'react'
import type { FormEvent } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { fieldErrorsFromZod } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'

import { useRegisterMutation } from '../api/authApi'
import { PASSWORD_HINT, registerSchema } from '../model/validation'

export function RegisterForm() {
  const [register, { isLoading }] = useRegisterMutation()
  const [values, setValues] = useState({ email: '', password: '', username: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFormError(null)

    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error))
      return
    }

    setFieldErrors({})

    try {
      await register(parsed.data).unwrap()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.message)
      if (normalized.fieldErrors) setFieldErrors(normalized.fieldErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <Field label="Email" error={fieldErrors['email']}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="email"
            name="email"
            autoComplete="username"
            required
            value={values.email}
            hasError={Boolean(fieldErrors['email'])}
            onChange={(event) => {
              setValues((current) => ({ ...current, email: event.target.value }))
            }}
          />
        )}
      </Field>

      <Field
        label="Display name"
        hint="Optional — the assistant uses it to address you."
        error={fieldErrors['username']}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="text"
            name="username"
            autoComplete="nickname"
            maxLength={50}
            value={values.username}
            hasError={Boolean(fieldErrors['username'])}
            onChange={(event) => {
              setValues((current) => ({ ...current, username: event.target.value }))
            }}
          />
        )}
      </Field>

      <Field label="Password" hint={PASSWORD_HINT} error={fieldErrors['password']}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={values.password}
            hasError={Boolean(fieldErrors['password'])}
            onChange={(event) => {
              setValues((current) => ({ ...current, password: event.target.value }))
            }}
          />
        )}
      </Field>

      <Button type="submit" isLoading={isLoading} className="mt-1 w-full">
        Create account
      </Button>
    </form>
  )
}
