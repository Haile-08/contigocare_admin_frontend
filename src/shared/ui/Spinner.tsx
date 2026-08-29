import { cn } from '@/shared/lib/cn'

export interface SpinnerProps {
  className?: string
  /** Announced to screen readers; pass null inside an element that already labels itself. */
  label?: string | null
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <>
      <svg
        className={cn('animate-spin', className ?? 'size-5')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  )
}
