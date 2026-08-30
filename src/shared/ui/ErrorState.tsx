import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

import { Button } from './Button'

/**
 * The single error surface for a failed query.
 *
 * Takes RTK Query's raw error union and renders it — components pass `error`
 * straight through without unwrapping it first, so no screen has to know the
 * shape of a transport failure.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const { message, messageKey, status } = normalizeApiError(error)

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-critical-soft text-critical">
        !
      </div>
      <p className="text-[13px] font-medium text-body">{t('error.couldNotLoad')}</p>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">
        {messageKey ? t(messageKey) : message}
      </p>
      {typeof status === 'number' ? (
        <p className="mt-1 font-mono text-[11px] text-faint">{t('error.httpStatus', { status })}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-4" size="sm" variant="secondary" onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
      ) : null}
    </div>
  )
}
