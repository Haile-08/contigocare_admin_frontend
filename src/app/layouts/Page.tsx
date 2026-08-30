import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * The standard scrolling page body.
 *
 * `AppLayout` hands each route a fixed-height box and no padding, so the screen
 * decides how that height is spent. This is the answer for the common case —
 * one column that scrolls — and it keeps the page gutter in a single place
 * rather than repeated down every route. The dashboard, which splits the box
 * into two independently scrolling columns, deliberately does not use it.
 */
export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('scroll-slim h-full overflow-y-auto px-5 pt-5 pb-12 lg:px-6', className)}>
      {children}
    </div>
  )
}

/**
 * Standard page heading. The design sets a screen title at 17 px medium, not a
 * display size — the numbers on the page are what should be large, and a
 * heading that competes with them is the fastest way to make a console feel
 * like a brochure.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[17px] leading-tight font-medium tracking-[-0.015em] text-body">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[11.5px] text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
