import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

/**
 * KPI tile.
 *
 * Two things carry the design here. The number is the largest thing on the
 * screen and set light — 30 px at weight 400 — because size, not weight, is
 * what makes a figure read first. And every tile ends in a footer strip that
 * links to the screen the number came from, so a KPI is a way into the data
 * rather than a dead end.
 */
export function StatCard({
  label,
  value,
  icon,
  caption,
  action,
  isLoading = false,
}: {
  label: string
  value: string
  icon: IconName
  /** What the number is measured over — the sample, the period, the scope. */
  caption?: string
  action?: { to: string; label: string }
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col rounded-md border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="flex-1 px-3.75 pt-3.5 pb-3.25">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] text-muted">{label}</span>
          <Icon name={icon} className="size-3.75 text-faint" />
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          {isLoading ? (
            <Skeleton className="h-7.5 w-24" />
          ) : (
            <span className="tnum text-[30px] leading-none font-normal tracking-[-0.03em] text-body">
              {value}
            </span>
          )}
        </div>

        {caption ? <p className="mt-2 text-[11px] text-faint">{caption}</p> : null}
      </div>

      {action ? (
        <Link
          to={action.to}
          className={cn(
            'flex items-center justify-between border-t border-line-faint px-3.75 py-2.5',
            'text-[11.5px] text-muted transition-colors hover:bg-canvas hover:text-body',
          )}
        >
          {action.label}
          <Icon name="arrowRight" className="size-3.25" strokeWidth={1.7} />
        </Link>
      ) : null}
    </div>
  )
}
