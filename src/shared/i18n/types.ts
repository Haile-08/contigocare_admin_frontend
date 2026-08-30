/**
 * The console speaks English and Spanish.
 *
 * A locale is a plain two-letter code in state and in storage; the BCP-47 tag
 * it maps to is only ever needed by `Intl`, so it lives here rather than being
 * the thing we store — swapping `es-ES` for `es-MX` later must not invalidate
 * everybody's saved preference.
 */

export const LOCALES = ['en', 'es'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** What `Intl` and `<html lang>` want. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

/** How each language names itself — a language picker is never translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

/**
 * A phrase is either fixed text or a count-dependent pair. English and Spanish
 * share the same one/other split, so two forms is the whole rule — a language
 * with more (Polish, Russian) would need `Intl.PluralRules` here instead.
 */
export type Phrase = string | { one: string; other: string }

/** Values interpolated into `{placeholders}`. */
export type TranslationVars = Record<string, string | number>

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value)
}
