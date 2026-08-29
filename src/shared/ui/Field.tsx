import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface FieldProps {
  label: string
  error?: string | undefined
  hint?: string | undefined
  children: (props: {
    id: string
    'aria-invalid': boolean | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}

/**
 * Label + control + message, with the ARIA wiring done once.
 *
 * The control is supplied as a render prop so the generated ids can be handed
 * to it — `aria-describedby` and `aria-invalid` are what make an error message
 * reach a screen reader, and they are the first thing forgotten when each form
 * wires its own.
 */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}

      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends ComponentPropsWithRef<'input'> {
  hasError?: boolean
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
        'focus:outline-2 focus:outline-offset-0',
        hasError
          ? 'border-red-400 focus:outline-red-500'
          : 'border-slate-300 focus:outline-brand-500',
        'disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...props}
    />
  )
}
