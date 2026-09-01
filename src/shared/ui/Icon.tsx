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
  list: 'M4 6h16M4 12h16M4 18h9',
  // A sheet with a folded corner: the analysis screen's subject is a document,
  // and a generic file glyph reads as "attachment" instead.
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  upload: 'M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  // `upload` with the arrow reversed, so the pair reads as one gesture in two
  // directions rather than two unrelated glyphs.
  download: 'M12 4v12M8 12l4 4 4-4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  // Two offset sheets, for copy-to-clipboard.
  copy: 'M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM5 15a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1',
  // The redaction affordance. A shield rather than a lock: the operator is
  // removing something to protect it, not sealing it away.
  shield: 'M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9z',
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
  // An open envelope flap rather than a closed rectangle: the sealed version is
  // indistinguishable from `document` at the sizes this is drawn at.
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  // A key, for the password reset screen. Bit toward the bottom right so it
  // reads at 20 px without the teeth merging into the shaft.
  key: 'M15.5 3a5.5 5.5 0 1 0-4.1 9.17L10 13.5H8v2H6v2H3v-3l7.4-7.4A5.5 5.5 0 0 0 15.5 3zM16.5 7h.01',
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
