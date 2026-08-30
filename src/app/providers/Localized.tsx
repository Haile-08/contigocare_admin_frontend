import type { ReactNode } from 'react'

import { selectLocale } from '@/features/ui/model/uiSlice'
import { I18nProvider } from '@/shared/i18n'

import { useAppSelector } from '../store/hooks'

/**
 * Bridges the store's locale into the i18n context.
 *
 * It exists so `shared/ui` can translate without importing the store: the
 * language is selected here, once, and every layer below reads it from context.
 *
 * Must sit inside the redux `<Provider>`. The test harness mounts the same
 * component, so switching language in a test exercises the production path.
 */
export function Localized({ children }: { children: ReactNode }) {
  const locale = useAppSelector(selectLocale)

  return <I18nProvider locale={locale}>{children}</I18nProvider>
}
