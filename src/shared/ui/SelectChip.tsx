import { useId } from 'react'

import { cn } from '@/shared/lib/cn'

import { Icon, type IconName } from './Icon'

/**
 * The design's filter chip — an icon, the current value, and a chevron.
 *
 * A real `<select>` is laid transparently over the chip rather than
 * reimplemented with a listbox. That keeps keyboard support, type-ahead, the
 * platform's own dropdown and the mobile picker, none of which a hand-rolled
 * menu gets for free, and leaves this file with nothing to do but the styling.
 */
export function SelectChip<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
  className,
}: {
  /** Accessible name — the chip itself only shows the selected value. */
  label: string
  icon: IconName
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
}) {
  const id = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value as T)
        }}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div
        aria-hidden="true"
        className={cn(
          'flex h-8.5 items-center gap-1.75 rounded-[9px] border border-line-soft bg-surface px-2.5',
          'text-[12px] whitespace-nowrap text-mid transition-colors',
          'peer-hover:border-line-strong peer-hover:bg-canvas',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink',
        )}
      >
        <Icon name={icon} className="size-3.25" strokeWidth={1.7} />
        {selected?.label ?? value}
        <Icon name="chevronDown" className="size-2.75 text-faint" strokeWidth={2.2} />
      </div>
    </div>
  )
}
