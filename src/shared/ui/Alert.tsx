import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

type AlertTone = 'error' | 'info' | 'success'

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}

const TONES: Record<AlertTone, string> = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-slate-50 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      // `alert` interrupts a screen reader; `status` waits for a pause.
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md px-3 py-2 text-sm ring-1 ring-inset', TONES[tone], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children}
    </div>
  )
}
