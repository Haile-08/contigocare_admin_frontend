import { createContext, use } from 'react'

import { formattersFor } from '@/shared/lib/format'
import type { Formatters } from '@/shared/lib/format'

import { translator } from './translate'
import type { TFunction } from './translate'
import { DEFAULT_LOCALE } from './types'
import type { Locale } from './types'

/**
 * The locale reaches components through context rather than through the store
 * directly, for one structural reason: `shared/ui` renders user-facing text
 * (an error panel, a spinner's label) and must not import from `features` or
 * `app`. A context declared here is something every layer may read.
 *
 * The store is still the source of truth — `app/App` selects the locale and
 * feeds it into the provider, so there is exactly one place it can change.
 */

export interface I18n {
  locale: Locale
  /** Translate a key. See `translate.ts`. */
  t: TFunction
  /** Number, date and relative-time formatting for this locale. */
  fmt: Formatters
}

/** `t` and `fmt` are already cached per locale, so this is the only allocation. */
export function i18nFor(locale: Locale): I18n {
  return { locale, t: translator(locale), fmt: formattersFor(locale) }
}

// Defaulting to English rather than throwing keeps an isolated render (a unit
// test mounting one component) working without a provider.
export const I18nContext = createContext<I18n>(i18nFor(DEFAULT_LOCALE))

export function useTranslation(): I18n {
  return use(I18nContext)
}
