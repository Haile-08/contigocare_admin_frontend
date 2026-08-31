import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

import { useConfirmEnrollmentMutation, useStartEnrollmentMutation } from '../api/authApi'
import { createMfaSchema } from '../model/validation'
import { AuthSteps } from './AuthSteps'
import { CodeInput } from './CodeInput'

/**
 * First-login enrolment: scan a QR, then prove you can read a code from it.
 *
 * The seed is generated server-side and is only *provisional* until the code
 * below is accepted — an account with an unconfirmed seed still cannot sign in.
 * That ordering is what stops a mis-scanned QR from locking someone out of an
 * account they have the password for.
 */
export function EnrollmentPanel() {
  const { t } = useTranslation()
  const [start, { data: enrollment, isLoading: isStarting, error: startError }] =
    useStartEnrollmentMutation()
  const [confirm, { isLoading: isConfirming }] = useConfirmEnrollmentMutation()

  const [code, setCode] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)

  const schema = useMemo(() => createMfaSchema(t), [t])

  // One call, on mount. Calling it again would issue a different seed and
  // invalidate the QR the operator is in the middle of scanning.
  useEffect(() => {
    void start()
  }, [start])

  /**
   * The QR arrives as SVG markup. It is rendered through a data URI on an
   * `<img>` rather than injected with `dangerouslySetInnerHTML`: an inline SVG
   * is part of the document and can carry script, while an SVG loaded as an
   * image cannot execute anything. The markup is our own, but "our own" is a
   * property of today's code, not a guarantee.
   */
  const qrSource = useMemo(() => {
    if (!enrollment?.qrSvg) return null
    return `data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qrSvg)}`
  }, [enrollment])

  const submit = async (candidate: string): Promise<void> => {
    setFormError(null)

    const parsed = schema.safeParse({ code: candidate })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }

    setFieldError(undefined)

    try {
      await confirm(parsed.data).unwrap()
    } catch (error) {
      const normalized = normalizeApiError(error)
      setFormError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
      setCode('')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void submit(code)
  }

  if (isStarting) {
    return (
      <div className="flex items-center justify-center py-16 text-muted">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (startError || !enrollment) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">{t('enroll.startFailed')}</Alert>
        <Button variant="secondary" onClick={() => void start()} className="h-10">
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6.5">
      <AuthSteps steps={['enroll.step1', 'enroll.step2', 'enroll.step3']} />

      <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
        {qrSource ? (
          // A white plate behind the code regardless of theme: a QR inverted by
          // dark mode is unreadable to every scanner.
          <div className="rounded-xs bg-white p-3">
            <img src={qrSource} alt={t('enroll.qrAlt')} className="size-44" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowSecret((current) => !current)}
          className="text-[11.5px] text-muted underline-offset-4 transition-colors hover:text-body hover:underline"
        >
          {showSecret ? t('enroll.hideSecret') : t('enroll.cannotScan')}
        </button>

        {showSecret ? (
          <div className="flex w-full flex-col gap-1.5">
            <p className="text-[11.5px] text-faint">{t('enroll.secretHint')}</p>
            <code className="rounded-xs border border-line-soft bg-surface px-3 py-2.5 text-center font-mono text-[12.5px] break-all text-body select-all">
              {enrollment.secret}
            </code>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
        <CodeInput
          label={t('enroll.codeLabel')}
          hint={t('enroll.codeHint')}
          value={code}
          error={fieldError}
          onChange={setCode}
          onComplete={(value) => {
            if (!isConfirming) void submit(value)
          }}
        />

        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Button
          type="submit"
          isLoading={isConfirming}
          disabled={code.length !== 6}
          className="h-12 w-full text-[13px]"
        >
          {t('enroll.submit')}
        </Button>
      </form>
    </div>
  )
}
