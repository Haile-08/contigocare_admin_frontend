import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

import { Icon } from './Icon'

/**
 * The surface everything on a screen sits in: white, one hairline, 12 px.
 * No shadow — in this design depth is drawn with a border, and a card that
 * lifts off the page breaks the flat plane the rest of the console lives on.
 */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-md border border-line bg-surface', className)}>
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex justify-between gap-4 px-4.5 pt-3.5 pb-3',
        description ? 'items-start' : 'items-center',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[13.5px] font-medium text-body">{title}</h2>
        {description ? <p className="mt-0.5 text-[11.5px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4.5 pb-4', className)}>{children}</div>
}

/**
 * The design's "more" affordance: a quiet label and an arrow, used in card
 * headers and in the footer strip of a stat tile. It is a link and not a
 * button, so it can be opened in a new tab like any other destination.
 */
export function CardLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-body',
        className,
      )}
    >
      {children}
      <Icon name="arrowRight" className="size-3" strokeWidth={1.8} />
    </Link>
  )
}
