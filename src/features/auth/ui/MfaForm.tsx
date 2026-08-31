import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useAppDispatch } from '@/app/store/hooks'
import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

import { useVerifyMfaMutation } from '../api/authApi'
import { stageChanged } from '../model/authSlice'
import { createMfaSchema } from '../model/validation'
import { CodeInput } from './CodeInput'

/**
 * Step two of every sign-in.
 *
 * On success the store receives a session and the route guard redirects — the
 * form never navigates, so there is exactly one place that decides where a
 * signed-in operator belongs.
 */
export function MfaForm() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [verify, { isLoading }] = useVerifyMfaMutation()
  const [code, setCode] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)

  const schema = useMemo(() => createMfaSchema(t), [t])

  const submit = async (candidate: string): Promise<void> => {
    setFormError(null)

    const parsed = schema.safeParse({ code: candidate })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }

    setFieldError(undefined)

    try {
      await verify(parsed.data).unwrap()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
      // Clear the field on failure: the code is single-use and the one that
      // just failed can never succeed, so leaving it invites a pointless retry.
      setCode('')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void submit(code)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
      <CodeInput
        label={t('mfa.codeLabel')}
        hint={t('mfa.codeHint')}
        value={code}
        error={fieldError}
        autoFocus
        onChange={setCode}
        // Six digits is unambiguous — there is nothing else the operator could
        // be about to type, so making them reach for the button is friction.
        onComplete={(value) => {
          if (!isLoading) void submit(value)
        }}
      />

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="flex flex-col gap-3.5">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={code.length !== 6}
          className="h-12 w-full text-[13px]"
        >
          {t('mfa.submit')}
        </Button>

        <button
          type="button"
          onClick={() => dispatch(stageChanged('recovery'))}
          className="text-[12.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
        >
          {t('mfa.useRecovery')}
        </button>
      </div>
    </form>
  )
}
