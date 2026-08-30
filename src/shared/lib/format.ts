import { DEFAULT_LOCALE, LOCALE_TAGS } from '@/shared/i18n/types'
import type { Locale } from '@/shared/i18n/types'

/**
 * Display formatting, in one place.
 *
 * Every number, date and initial the console renders goes through here, so no
 * screen invents its own date format. The formatters are *per locale*: Spanish
 * groups thousands with a dot and writes "hace 3 horas", which `Intl` gets
 * right only if it is told the language.
 *
 * `Intl` objects are expensive to build, so a locale's set is built once on
 * first use and cached — there are two of them, and switching language must not
 * re-instantiate six formatters on every render.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function build(tag: string) {
  const numberFormat = new Intl.NumberFormat(tag)
  const decimalFormat = new Intl.NumberFormat(tag, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const percentFormat = new Intl.NumberFormat(tag, {
    style: 'percent',
    maximumFractionDigits: 0,
  })
  const dateFormat = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeFormat = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit' })
  const relativeFormat = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' })

  return {
    number: (value: number): string => numberFormat.format(value),

    /** One decimal place — for averages, where a rounded integer hides the point. */
    decimal: (value: number): string => decimalFormat.format(value),

    /** Takes a ratio (0.42), not a percentage (42). */
    percent: (ratio: number): string => percentFormat.format(ratio),

    date: (value: string | number | Date): string => dateFormat.format(new Date(value)),

    time: (value: string | number | Date): string => timeFormat.format(new Date(value)),

    /** "3 hours ago" — the console's answer to "when", everywhere but a table. */
    relative: (value: string | number | Date): string => {
      const elapsed = new Date(value).getTime() - Date.now()
      const magnitude = Math.abs(elapsed)

      if (magnitude < HOUR) return relativeFormat.format(Math.round(elapsed / MINUTE), 'minute')
      if (magnitude < DAY) return relativeFormat.format(Math.round(elapsed / HOUR), 'hour')
      if (magnitude < 30 * DAY) return relativeFormat.format(Math.round(elapsed / DAY), 'day')
      return dateFormat.format(new Date(value))
    },
  }
}

export type Formatters = ReturnType<typeof build>

const cache = new Map<Locale, Formatters>()

/** The formatter set for a locale. Components get theirs from `useTranslation()`. */
export function formattersFor(locale: Locale): Formatters {
  const existing = cache.get(locale)
  if (existing) return existing

  const formatters = build(LOCALE_TAGS[locale] ?? LOCALE_TAGS[DEFAULT_LOCALE])
  cache.set(locale, formatters)
  return formatters
}

/**
 * The default-locale set, for the few places outside React that format a value
 * (and as the fallback in an unlocalised render). Inside a component, prefer
 * `const { fmt } = useTranslation()` so the output follows the chosen language.
 */
export const fmt = formattersFor(DEFAULT_LOCALE)

/** Up to two letters for an avatar. Falls back to the email's local part. */
export function initials(name: string | null | undefined, email?: string | null): string {
  const source = name?.trim() || email?.split('@')[0] || ''
  if (!source) return '··'

  const words = source.split(/[\s._-]+/).filter(Boolean)
  const letters = words.slice(0, 2).map((word) => word[0] ?? '')
  return (letters.join('') || source.slice(0, 2)).toUpperCase()
}

/** Trims a label to fit a chart tick or a dense row without a tooltip. */
export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}
