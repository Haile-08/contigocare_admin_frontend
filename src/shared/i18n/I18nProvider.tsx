import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { I18nContext, i18nFor } from './context'
import type { Locale } from './types'

/** Publishes one locale's `t` and `fmt` to the tree. See `context.ts`. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => i18nFor(locale), [locale])

  return <I18nContext value={value}>{children}</I18nContext>
}
