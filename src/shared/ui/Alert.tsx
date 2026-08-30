import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

type AlertTone = 'error' | 'info' | 'success'

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}

/** Tinted, borderless — the same treatment as a status badge, one size up. */
const TONES: Record<AlertTone, string> = {
  error: 'bg-critical-soft text-critical',
  info: 'bg-surface-sunk text-mid',
  success: 'bg-positive-soft text-positive',
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      // `alert` interrupts a screen reader; `status` waits for a pause.
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xs px-3 py-2 text-[12px] leading-relaxed',
        TONES[tone],
        className,
      )}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children}
    </div>
  )
}
