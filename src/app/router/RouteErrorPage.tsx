import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { useTranslation } from '@/shared/i18n'
import { logger } from '@/shared/lib/logger'
import { Button } from '@/shared/ui/Button'

/**
 * Catches errors thrown during routing — including a failed `lazy()` chunk
 * load, which is the common case after a deploy replaces the files the open
 * tab was built against. Reloading fetches the new build.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  const { t } = useTranslation()

  logger.error('route error', {
    detail: isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error),
  })

  // A router status line ("404 — Not Found") is the browser's own wording; only
  // our fallback title is ours to translate.
  const title = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : t('error.boundaryTitle')

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <h1 className="text-[17px] font-medium tracking-[-0.015em] text-body">{title}</h1>
      <p className="max-w-sm text-[12.5px] leading-relaxed text-muted">
        {t('error.routeBody')}
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          globalThis.location.reload()
        }}
      >
        {t('common.reload')}
      </Button>
    </main>
  )
}
