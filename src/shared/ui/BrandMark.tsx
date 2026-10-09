import { cn } from '@/shared/lib/cn'

/**
 * The karai.health mark — the artwork in `public/icon.svg`, inlined.
 *
 * Inlined rather than referenced as `<img src="/icon.svg">` for two reasons:
 * it costs no request and cannot flash in after the shell paints, and — the
 * one that matters here — the colours become ours. The mark is green
 * (`--color-brand`) on every surface, and the inner cut that the source file
 * draws in black is redrawn in the surface colour, so it reads as a notch in
 * the green rather than as a second, foreign ink. That is also what makes the
 * mark work unchanged in dark mode, where both tokens flip.
 *
 * Geometry is the source file's, untouched. The viewBox is cropped to the
 * artwork's own bounds so the gap to the wordmark is the gap you set and not
 * the file's empty margin.
 *
 * Decorative by default. Pass `label` only where the mark is the sole
 * identification of the brand; beside the wordmark it would be read twice.
 */
export function BrandMark({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="60 55 380 395"
      className={cn('block h-6 w-auto shrink-0 text-brand', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <rect
        x="80.2937"
        y="232.777"
        width="240"
        height="240"
        transform="rotate(-45 80.2937 232.777)"
        stroke="currentColor"
        strokeWidth="10"
      />
      <rect
        x="213.414"
        y="371.554"
        width="248"
        height="52"
        transform="rotate(-45 213.414 371.554)"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="74.6369"
        y="232.777"
        width="52"
        height="248"
        transform="rotate(-45 74.6369 232.777)"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="129.111"
        y="288.666"
        width="170.962"
        height="171.912"
        transform="rotate(-45 129.111 288.666)"
        fill="currentColor"
      />
      {/* The source file's black inset. Painted in the surface colour so the
          mark stays two-tone — green and whatever it sits on. */}
      <rect
        x="132.647"
        y="288.666"
        width="165.962"
        height="166.912"
        transform="rotate(-45 132.647 288.666)"
        stroke="var(--color-surface)"
        strokeWidth="5"
      />
      <line
        x1="73"
        y1="439.298"
        x2="427.001"
        y2="439.298"
        stroke="currentColor"
        strokeWidth="10"
      />
    </svg>
  )
}

/** The mark plus the product name, as one lockup. */
export function BrandLockup({ className, name }: { className?: string; name: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className="h-7" />
      <span className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-body">
        {name}
      </span>
    </span>
  )
}
