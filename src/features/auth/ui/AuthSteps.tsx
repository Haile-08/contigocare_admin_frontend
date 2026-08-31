import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

/**
 * The numbered list every auth screen opens with.
 *
 * It was copied by hand into the enrolment and recovery panels, and the two
 * copies had already drifted apart in gap and text size. Every screen in this
 * flow answers a variant of "here is what happens next", so the list is one
 * component and a new screen cannot re-implement it slightly differently.
 */
export function AuthSteps({ steps }: { steps: TranslationKey[] }) {
  const { t } = useTranslation()

  return (
    <ol className="flex flex-col gap-3.5 text-[12.5px] leading-[1.55] text-muted">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-2.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-sunk text-[10.5px] font-medium text-body">
            {index + 1}
          </span>
          {t(step)}
        </li>
      ))}
    </ol>
  )
}
