import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { logger } from '@/shared/lib/logger'
import { Button } from '@/shared/ui/Button'

/**
 * Catches errors thrown during routing — including a failed `lazy()` chunk
 * load, which is the common case after a deploy replaces the files the open
 * tab was built against. Reloading fetches the new build.
 */
export function RouteErrorPage() {
  const error = useRouteError()

  logger.error('route error', {
    detail: isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : String(error),
  })

  const title = isRouteErrorResponse(error) ? `${error.status} — ${error.statusText}` : 'Something went wrong'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">
        This page could not be loaded. Reloading usually fixes it.
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          globalThis.location.reload()
        }}
      >
        Reload
      </Button>
    </main>
  )
}
