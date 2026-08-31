import { useState } from 'react'

import { useAppDispatch } from '@/app/store/hooks'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

import { recoveryCodesDismissed } from '../model/authSlice'
import { AuthSteps } from './AuthSteps'

interface RecoveryCodesPanelProps {
  codes: string[]
}

/**
 * Shown exactly once, immediately after enrolment.
 *
 * The server stores only bcrypt hashes of these, so this render is genuinely
 * the only time they exist in readable form anywhere. The dismiss button is
 * therefore gated behind an explicit acknowledgement rather than being a plain
 * "Continue" — the cost of clicking past this screen without reading it is a
 * database edit later.
 *
 * Built as the enrolment screen's closing beat, and laid out to say so: the
 * same numbered steps, the same bordered plate — holding the codes where the QR
 * was — then the same acknowledgement and full-width button. It follows the QR
 * screen by a single click, and the two looking like one flow is the point.
 *
 * The codes are deliberately not offered as a download: the viewer's browser is
 * not where a break-glass credential should end up by default, and
 * copy-to-clipboard plus a print dialog covers the ways an operator actually
 * stores these.
 */
export function RecoveryCodesPanel({ codes }: RecoveryCodesPanelProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied outright; the codes are on screen and
      // selectable, so there is nothing to recover from.
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-6.5">
      <AuthSteps steps={['recoveryCodes.step1', 'recoveryCodes.step2', 'recoveryCodes.step3']} />

      <div className="flex flex-col items-center gap-3.5 rounded-sm border border-line bg-canvas p-5">
        {/* Two columns at every width. The codes are ten characters, so a
            single column would be a tall list of short lines, and three would
            wrap on a phone. */}
        <ul className="grid w-full grid-cols-2 gap-2">
          {codes.map((code) => (
            <li
              key={code}
              className="rounded-xs bg-surface px-2.5 py-2 text-center font-mono text-[12.5px] tracking-wider text-body select-all"
            >
              {code}
            </li>
          ))}
        </ul>

        <div className="flex w-full gap-2.5">
          <Button variant="secondary" onClick={() => void handleCopy()} className="h-9 flex-1">
            {copied ? t('recoveryCodes.copied') : t('recoveryCodes.copy')}
          </Button>
          <Button variant="secondary" onClick={() => globalThis.print()} className="h-9 flex-1">
            {t('recoveryCodes.print')}
          </Button>
        </div>
      </div>

      <Alert tone="warning">{t('recoveryCodes.warning')}</Alert>

      <div className="flex flex-col gap-3.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.5] text-muted">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-ink"
          />
          {t('recoveryCodes.acknowledge')}
        </label>

        <Button
          disabled={!acknowledged}
          onClick={() => dispatch(recoveryCodesDismissed())}
          className="h-12 w-full text-[13px]"
        >
          {t('recoveryCodes.continue')}
        </Button>
      </div>
    </div>
  )
}
