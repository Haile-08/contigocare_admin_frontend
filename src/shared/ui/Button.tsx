import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink-hover disabled:bg-faint',
  secondary:
    'bg-surface text-mid border border-line-soft hover:border-line-strong hover:bg-canvas hover:text-body',
  ghost: 'text-muted hover:bg-surface-sunk hover:text-body',
  danger: 'bg-critical text-white hover:opacity-90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7.5 gap-1.5 px-2.5 text-[11.5px]',
  md: 'h-8.5 gap-2 px-3 text-[12.5px]',
}

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Renders a spinner and blocks input — use for the in-flight state of a mutation. */
  isLoading?: boolean
  leadingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      // Buttons default to `type="submit"` inside a form, which submits by
      // accident far more often than it helps.
      type={type}
      // A loading button stays focusable but is inert, so a double-click or a
      // second Enter press can't fire the mutation twice.
      disabled={disabled === true || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xs font-medium whitespace-nowrap',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner className="size-3.5" label={null} /> : leadingIcon}
      {children}
    </button>
  )
}
