import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <div className="mb-3.5 size-9 rounded-full border border-dashed border-line-strong" />
      <p className="text-[13px] font-medium text-body">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
