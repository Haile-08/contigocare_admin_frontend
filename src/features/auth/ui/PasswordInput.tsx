import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { Input, type InputProps } from '@/shared/ui/Field'

/**
 * A password field with a reveal toggle.
 *
 * The toggle lives outside the `<label>` and carries its own `aria-label` and
 * `aria-pressed`, so it never becomes part of the field's accessible name and
 * never steals the click that should focus the input.
 */
export function PasswordInput({ className, ...props }: Omit<InputProps, 'type' | 'trailing'>) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)

  return (
    <Input
      type={shown ? 'text' : 'password'}
      placeholder="••••••••"
      wrapperClassName="gap-1.75"
      className={className ?? 'h-11.5 pr-11 pl-3.5'}
      trailing={
        <button
          type="button"
          onClick={() => {
            setShown((value) => !value)
          }}
          aria-label={shown ? t('field.hidePassword') : t('field.showPassword')}
          aria-pressed={shown}
          className="mr-0.5 grid size-8.5 place-items-center rounded-xs text-faint transition-colors hover:text-body"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
            <circle cx="12" cy="12" r="2.6" />
            {shown ? <path d="m4 20 16-16" /> : null}
          </svg>
        </button>
      }
      {...props}
    />
  )
}
