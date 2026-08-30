import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { Skeleton } from '@/shared/ui/Skeleton'

import type { Overview } from '../api/metricsApi'

/**
 * Who is doing the talking — a ranked horizontal bar list.
 *
 * Two labelled magnitudes don't need a charting library: plain elements give us
 * direct labels on every bar (so identity never rests on colour alone), real
 * text for screen readers, and no bundle cost.
 *
 * The two colours are the chart's, in the same roles: the deep green is
 * what a person wrote, the pale one is the assistant. Two greens rather than
 * two hues because they separate by lightness, which survives both dark mode
 * and colour-vision deficiency — and the labels carry the meaning regardless.
 */
const ROWS = [
  { key: 'userMessages', labelKey: 'dashboard.stat.asked', color: 'var(--color-ink)' },
  {
    key: 'assistantMessages',
    labelKey: 'dashboard.stat.answered',
    color: 'var(--color-chart-bar)',
  },
] as const satisfies ReadonlyArray<{ key: string; labelKey: TranslationKey; color: string }>

export function MessageMix({
  overview,
  isLoading,
}: {
  overview: Overview | undefined
  isLoading: boolean
}) {
  const { t, fmt } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        {ROWS.map((row) => (
          <div key={row.key}>
            <Skeleton className="mb-2 h-2.5 w-28" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!overview || overview.messages === 0) {
    return <p className="py-6 text-center text-[11.5px] text-muted">{t('opsRail.mixEmpty')}</p>
  }

  const max = Math.max(overview.userMessages, overview.assistantMessages)

  return (
    <ul className="flex flex-col gap-3">
      {ROWS.map((row) => {
        const value = overview[row.key]
        const share = overview.messages === 0 ? 0 : value / overview.messages

        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11.5px]">
              <span className="flex min-w-0 items-center gap-1.75">
                <span
                  aria-hidden="true"
                  className="size-1.75 shrink-0 rounded-[2px]"
                  style={{ background: row.color }}
                />
                <span className="truncate text-body">{t(row.labelKey)}</span>
              </span>
              <span className="tnum shrink-0 font-mono text-muted">
                {fmt.number(value)}
                <span className="ml-1.5 text-faint">{fmt.percent(share)}</span>
              </span>
            </div>

            {/* Bars share one scale (max), so lengths are comparable. */}
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunk">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${max === 0 ? 0 : (value / max) * 100}%`,
                  background: row.color,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
