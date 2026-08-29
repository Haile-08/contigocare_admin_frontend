import { useState } from 'react'
import type { FormEvent } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { fieldErrorsFromZod } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'

import { useLoginMutation } from '../api/authApi'
import { loginSchema } from '../model/validation'

/**
 * On success the auth state flips and the route guard redirects — no
 * imperative `navigate()` here, so there is exactly one place that decides
 * where a signed-in user belongs.
 */
export function LoginForm() {
  const [login, { isLoading }] = useLoginMutation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error))
      return
    }

    setFieldErrors({})

    try {
      await login(parsed.data).unwrap()
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

      <Field label="Password" error={fieldErrors['password']}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="password"
            name="password"
            autoComplete="current-password"
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
        Sign in
      </Button>
    </form>
  )
}
