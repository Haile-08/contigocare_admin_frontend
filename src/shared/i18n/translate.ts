import { en } from './en'
import type { Dictionary, TranslationKey } from './en'
import { es } from './es'
import { DEFAULT_LOCALE } from './types'
import type { Locale, TranslationVars } from './types'

export const DICTIONARIES: Record<Locale, Dictionary> = { en, es }

/**
 * `t('sessions.rename', { name })`.
 *
 * Two behaviours worth knowing:
 *
 *  - A `count` var selects between the `one` and `other` forms of a plural
 *    phrase automatically, so the call site never branches on it.
 *  - Placeholders are substituted textually and the result is rendered by React
 *    as a text node, so a value can never become markup. Anything needing
 *    *markup* inside a sentence (a link mid-paragraph) is composed in JSX from
 *    separate keys instead, which is why there is no rich-text form here.
 */
export type TFunction = (key: TranslationKey, vars?: TranslationVars) => string

const PLACEHOLDER = /\{(\w+)\}/g

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: TranslationVars,
): string {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
  const phrase = dictionary[key]

  const template =
    typeof phrase === 'string'
      ? phrase
      : Number(vars?.['count']) === 1
        ? phrase.one
        : phrase.other

  if (!vars) return template

  return template.replaceAll(PLACEHOLDER, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

/** A `t` bound to one locale. Memoised per locale so it is referentially stable. */
const bound = new Map<Locale, TFunction>()

export function translator(locale: Locale): TFunction {
  const existing = bound.get(locale)
  if (existing) return existing

  const t: TFunction = (key, vars) => translate(locale, key, vars)
  bound.set(locale, t)
  return t
}
