import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { LOCALES, LOCALE_NAMES, useTranslation } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { SelectChip } from '@/shared/ui/SelectChip'

import { localeChanged, selectLocale } from '../model/uiSlice'

/**
 * The language picker.
 *
 * Each option is written in its own language — "Español", never "Spanish" —
 * because the one person guaranteed not to read the current language is the
 * person looking for this control.
 *
 * It is a `SelectChip`, so it is the platform's own `<select>`: keyboard
 * support, type-ahead and the mobile picker come for free, and it matches the
 * dashboard's other filters rather than introducing a second kind of menu.
 */
const OPTIONS = LOCALES.map((locale) => ({ value: locale, label: LOCALE_NAMES[locale] }))

export function LanguageSelect({ className }: { className?: string }) {
  const dispatch = useAppDispatch()
  const locale = useAppSelector(selectLocale)
  const { t } = useTranslation()

  return (
    <SelectChip<Locale>
      label={t('common.language')}
      icon="globe"
      value={locale}
      options={OPTIONS}
      onChange={(next) => dispatch(localeChanged(next))}
      {...(className ? { className } : {})}
    />
  )
}
