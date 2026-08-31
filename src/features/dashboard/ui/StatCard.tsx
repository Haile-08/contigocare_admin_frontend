import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: IconName
  /** Draws attention when the figure is one that should not be rising. */
  tone?: 'default' | 'critical'
  children?: ReactNode
}

/**
 * One figure, stated plainly.
 *
 * No sparkline and no percentage-change chip. Both are the default decoration
 * on a stat tile and both are noise here: this console has one operator making
 * one decision at a time, and a delta against last week does not change what
 * they do next.
 */
export function StatCard({ label, value, hint, icon, tone = 'default', children }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] tracking-wide text-muted">{label}</span>
        {icon ? <Icon name={icon} className="size-3.5 text-faint" /> : null}
      </div>

      <span
        className={cn(
          'text-[26px] leading-none font-normal tracking-[-0.02em] tabular-nums',
          tone === 'critical' ? 'text-critical' : 'text-body',
        )}
      >
        {value}
      </span>

      {hint ? <span className="text-[10.5px] text-faint">{hint}</span> : null}
      {children}
    </div>
  )
}
