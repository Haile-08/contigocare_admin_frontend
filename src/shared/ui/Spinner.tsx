import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

export interface SpinnerProps {
  className?: string
  /**
   * Announced to screen readers. Omit for the generic "Loading"; pass null
   * inside an element that already labels itself.
   */
  label?: string | null
}

export function Spinner({ className, label }: SpinnerProps) {
  const { t } = useTranslation()
  const announced = label === undefined ? t('common.loading') : label

  return (
    <>
      <svg
        className={cn('size-4 shrink-0 animate-spin text-current', className)}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        <path
          d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {announced ? <span className="sr-only">{announced}</span> : null}
    </>
  )
}
