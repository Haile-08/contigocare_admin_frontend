import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'positive' | 'warning' | 'critical' | 'info'

/**
 * Status pills. Borderless tinted capsules — the tint is the boundary, and
 * adding a rule around it makes a row of them read as buttons.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunk text-mid',
  brand: 'bg-brand-soft text-ink',
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  critical: 'bg-critical-soft text-critical',
  info: 'bg-info-soft text-info',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.75',
        'text-[10.5px] leading-none whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
