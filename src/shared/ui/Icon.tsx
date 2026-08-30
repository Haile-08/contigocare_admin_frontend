import { cn } from '@/shared/lib/cn'

/**
 * The console's icon set.
 *
 * One registry of 24×24 stroke paths, drawn at a single weight, so every glyph
 * in the app — nav rail, stat tiles, list rows, buttons — reads as one hand.
 * Adding an icon means adding a path here rather than pasting an `<svg>` into a
 * component, which is how icon sets drift into four different stroke widths.
 */
const ICONS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  chat: 'M21 12a8 8 0 0 1-8 8H8l-5 3 1.2-4.2A8 8 0 0 1 13 4a8 8 0 0 1 8 8z',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  list: 'M4 6h16M4 12h16M4 18h9',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.38M15.5 4.24a3.75 3.75 0 0 1 0 7.02',
  user: 'M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  spark: 'M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  check: 'M20 6 9 17l-5-5',
  alert: 'M12 4 2.5 20h19zM12 10v4M12 17.5h.01',
  calendar: 'M3 5h18v16H3zM8 2v4M16 2v4M3 10h18',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  bell: 'M12 3a6 6 0 0 1 6 6c0 5 2 6 2 6H4s2-1 2-6a6 6 0 0 1 6-6zM10 20a2 2 0 0 0 4 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4.3-4.3',
  panel: 'M3 3h18v18H3zM9 3v18',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01',
  plus: 'M12 5v14M5 12h14',
  pencil: 'M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z',
  close: 'M18 6 6 18M6 6l12 12',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  logout: 'M15 17l5-5-5-5M20 12H9M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  // A meridian and the equator, not a full graticule: at 13 px anything denser
  // fills in solid.
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18',
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-4 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}
