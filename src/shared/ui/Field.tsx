import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * Form controls, with the accessibility wiring done once.
 *
 * The label, hint and error are all associated with the control, so a screen
 * reader announces a validation message the moment it appears — that wiring is
 * the first thing forgotten when every form rolls its own field.
 */

const CONTROL = cn(
  'w-full rounded-xs border border-line-soft bg-surface px-3 text-[12.5px] text-body',
  'placeholder:text-faint',
  'transition-[border-color,box-shadow] duration-150',
  'hover:border-line-strong',
  'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-muted',
  'aria-[invalid=true]:border-critical',
)

interface FieldShellProps {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: string | undefined
  children: ReactNode
  className?: string
}

/**
 * No asterisk on required fields: `required` on the control is what a screen
 * reader announces, and a glyph inside the `<label>` would become part of the
 * field's accessible name ("Email *") for no gain.
 */
function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="text-[12px] font-medium text-body">
          {label}
        </label>
      ) : null}

      {children}

      {/* Errors replace hints rather than stacking — one message per field. */}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[11.5px] text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11.5px] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface BaseFieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string | undefined
  wrapperClassName?: string
}

export interface InputProps extends BaseFieldProps, Omit<ComponentPropsWithRef<'input'>, 'size'> {
  /**
   * Control sitting on the right edge of the input — a password reveal toggle,
   * a unit suffix. Pad the input (`pr-*`) to keep text clear of it.
   */
  trailing?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  required,
  trailing,
  ...props
}: InputProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  const control = (
    <input
      id={fieldId}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
      className={cn(CONTROL, 'h-9', className)}
      {...props}
    />
  )

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      {trailing ? (
        <div className="relative">
          {control}
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        </div>
      ) : (
        control
      )}
    </FieldShell>
  )
}

export interface TextareaProps
  extends BaseFieldProps,
    ComponentPropsWithRef<'textarea'> {}

export function Textarea({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  required,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(CONTROL, 'min-h-20 py-2 leading-relaxed', className)}
        {...props}
      />
    </FieldShell>
  )
}
