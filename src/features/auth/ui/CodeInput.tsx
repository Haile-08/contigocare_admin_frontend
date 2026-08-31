import { useId } from 'react'
import type { ChangeEvent } from 'react'

import { cn } from '@/shared/lib/cn'

interface CodeInputProps {
  label: string
  value: string
  error?: string | undefined
  hint?: string | undefined
  autoFocus?: boolean
  onChange: (value: string) => void
  /** Fired when six digits are present, so the form can submit on its own. */
  onComplete?: (value: string) => void
}

/**
 * The six-digit field.
 *
 * A single input rather than six boxes: six boxes look like the design people
 * expect, and then they fight paste, fight password managers, fight screen
 * readers, and fight the browser's own SMS/TOTP autofill. One input with
 * `autocomplete="one-time-code"` gets all of that for free, and iOS and Android
 * will offer the code from the clipboard directly above the keyboard.
 *
 * `inputMode="numeric"` brings up the number pad without `type="number"`, which
 * would add spinners and silently drop a leading zero.
 */
export function CodeInput({
  label,
  value,
  error,
  hint,
  autoFocus,
  onChange,
  onComplete,
}: CodeInputProps) {
  const id = useId()

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    // Strip anything that is not a digit as it is typed, so a pasted "123 456"
    // or "123-456" lands correctly instead of failing validation.
    const digits = event.target.value.replaceAll(/\D/g, '').slice(0, 6)
    onChange(digits)
    if (digits.length === 6) onComplete?.(digits)
  }

  return (
    <div className="flex flex-col gap-1.75">
      <label htmlFor={id} className="text-[12px] font-medium text-body">
        {label}
      </label>

      <input
        id={id}
        name="one-time-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        // Never let a password manager or the browser store a value that is
        // only valid for thirty seconds.
        autoCorrect="off"
        spellCheck={false}
        maxLength={6}
        autoFocus={autoFocus}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={handleChange}
        className={cn(
          'h-14 w-full rounded-xs border border-line-soft bg-surface text-center',
          'font-mono text-[26px] tracking-[0.35em] text-body tabular-nums',
          'placeholder:tracking-[0.35em] placeholder:text-faint',
          'transition-[border-color] duration-150 hover:border-line-strong',
          'aria-[invalid=true]:border-critical',
        )}
        placeholder="······"
      />

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
