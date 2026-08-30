import { Fragment } from 'react'
import { Link, useMatches } from 'react-router-dom'

import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

/**
 * Attached to a route as `handle`, so the trail is declared with the route.
 * The crumb is a translation key: routes are declared at module load, long
 * before there is a language to render them in.
 */
export interface RouteHandle {
  crumb?: TranslationKey
}

/**
 * Breadcrumbs derived from the matched route chain.
 *
 * Nothing needs to be passed down or kept in sync: a route declares its own
 * label via `handle.crumb`, and this reads them off `useMatches`.
 */
export function Breadcrumbs() {
  const matches = useMatches()
  const { t } = useTranslation()

  const crumbs = matches.flatMap((match) => {
    const handle = match.handle as RouteHandle | undefined
    return handle?.crumb ? [{ label: t(handle.crumb), to: match.pathname }] : []
  })

  if (crumbs.length === 0) return null

  return (
    <nav aria-label={t('nav.breadcrumb')} className="min-w-0">
      {/* The current page is the header's title in this design, so the last
          crumb is set at title weight and the trail behind it recedes. */}
      <ol className="flex items-center gap-2 text-[12.5px]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <Fragment key={crumb.to}>
              {index > 0 ? (
                <li aria-hidden="true" className="text-faint">
                  /
                </li>
              ) : null}
              <li className="min-w-0">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate text-[15px] font-medium tracking-[-0.01em] text-body"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="truncate text-muted transition-colors hover:text-body"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
