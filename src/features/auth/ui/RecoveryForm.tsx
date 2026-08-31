import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useAppDispatch } from '@/app/store/hooks'
import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'

import { useUseRecoveryCodeMutation } from '../api/authApi'
import { stageChanged } from '../model/authSlice'
import { createRecoverySchema } from '../model/validation'
import { AuthSteps } from './AuthSteps'

/** `XXXXX-XXXXX`, with the dash placed for the operator as they type. */
function formatRecoveryCode(raw: string): string {
  const characters = raw.toUpperCase().replaceAll(/[^A-Z0-9]/g, '').slice(0, 10)
  return characters.length > 5
    ? `${characters.slice(0, 5)}-${characters.slice(5)}`
    : characters
}

/**
 * Sign-in with a backup code, for when the authenticator device is gone.
 *
 * Laid out as the mirror image of `EnrollmentPanel`: the same numbered steps,
 * the same bordered plate holding the thing the operator has to go and find,
 * then the same code field and button. The two screens are reached from the
 * same place and answer the same question — "prove this is you" — so a person
 * who has seen one should not have to re-read the other.
 */
export function RecoveryForm() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [redeemCode, { isLoading }] = useUseRecoveryCodeMutation()
  const [value, setValue] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)

  const schema = useMemo(() => createRecoverySchema(t), [t])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setFormError(null)

    const parsed = schema.safeParse({ recoveryCode: value })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }

    setFieldError(undefined)

    try {
      await redeemCode(parsed.data).unwrap()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
      setValue('')
    }
  }

  return (
    <div className="flex flex-col gap-6.5">
      <AuthSteps steps={['recovery.step1', 'recovery.step2', 'recovery.step3']} />

      {/* The plate the QR occupies on the enrolment screen. There is nothing to
          scan here, so it carries the single-use warning instead — the one thing
          an operator must read before spending a code. */}
      <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
        <div className="grid size-11 place-items-center rounded-full bg-surface-sunk text-muted">
          <Icon name="shield" className="size-5" />
        </div>

        <p className="text-center text-[12px] leading-relaxed text-muted">
          {t('recovery.warning')}
        </p>

        <button
          type="button"
          onClick={() => setShowHelp((current) => !current)}
          className="text-[11.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
        >
          {showHelp ? t('recovery.hideHelp') : t('recovery.lostCodes')}
        </button>

        {showHelp ? (
          <p className="w-full rounded-xs border border-line-soft bg-surface px-3 py-2.5 text-[11.5px] leading-relaxed text-faint">
            {t('recovery.lostCodesHint')}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
        <Input
          label={t('recovery.codeLabel')}
          hint={t('recovery.codeHint')}
          name="recovery-code"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          maxLength={11}
          placeholder="XXXXX-XXXXX"
          wrapperClassName="gap-1.75"
          // Sized to sit alongside the enrolment screen's six-digit field: same
          // height and weight, a step down in size because eleven characters
          // have to fit where six did.
          className="h-14 text-center font-mono text-[19px] tracking-[0.22em] text-body uppercase placeholder:tracking-[0.22em]"
          value={value}
          error={fieldError}
          onChange={(event) => setValue(formatRecoveryCode(event.target.value))}
        />

        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <div className="flex flex-col gap-3.5">
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={value.length < 8}
            className="h-12 w-full text-[13px]"
          >
            {t('recovery.submit')}
          </Button>

          <button
            type="button"
            onClick={() => dispatch(stageChanged('verify'))}
            className="text-[12.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
          >
            {t('recovery.backToCode')}
          </button>
        </div>
      </form>
    </div>
  )
}
