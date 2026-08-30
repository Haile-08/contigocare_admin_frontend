import { cn } from '@/shared/lib/cn'

export interface Series {
  id: string
  name: string
  /** Draws the swatch as the chart draws the mark: filled for a line, outlined for a bar. */
  mark: 'line' | 'bar'
  visible: boolean
}

/**
 * The chart's legend, and its controls.
 *
 * The legend sits inside the card header and each entry is clickable — naming a
 * series and hiding it are the same affordance, so there is no separate row of
 * checkboxes. A hidden series greys out rather than disappearing, which is what
 * keeps the control findable once it's off.
 */
export function SeriesLegend({
  series,
  onToggle,
}: {
  series: Series[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3.5">
      {series.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={item.visible}
          onClick={() => {
            onToggle(item.id)
          }}
          className={cn(
            'flex items-center gap-1.5 rounded text-[11px] transition-colors',
            item.visible ? 'text-mid hover:text-body' : 'text-faint',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.75 rounded-full',
              item.mark === 'line' ? 'bg-current' : 'border-[1.5px] border-current',
              item.visible && item.mark === 'line' && 'bg-ink',
            )}
          />
          {item.name}
        </button>
      ))}
    </div>
  )
}
