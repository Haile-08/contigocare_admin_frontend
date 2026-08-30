import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useTranslation } from '@/shared/i18n'
import { truncate } from '@/shared/lib/format'

import type { ConversationMetric } from '../api/metricsApi'

/**
 * Message volume, conversation by conversation.
 *
 * Two marks with very different weights: a recessive bar for the assistant's
 * replies, and a thin green line for what the person actually asked. That
 * ordering is the point — the bars give the line context without ever
 * competing with it, so the eye reads one series and consults the other. Axis
 * figures are mono so digits line up column-wise between ticks.
 *
 * Recharts lives only in this module. `DashboardPage` pulls it in with
 * `React.lazy`, which keeps ~90 kB of charting code out of every other route.
 */

const TICK = {
  fill: 'var(--color-faint)',
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
} as const

/**
 * Recharts types `content` against its own value/name union, which doesn't
 * narrow cleanly to our row type. We take only the field we use and validate
 * the payload at runtime instead of fighting the generic.
 */
interface ChartTooltipProps {
  active?: boolean | undefined
  payload?: ReadonlyArray<{ payload?: unknown }> | undefined
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const { t, fmt } = useTranslation()

  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ConversationMetric | undefined
  if (!point) return null

  return (
    <div className="min-w-40 rounded-sm border border-line-soft bg-surface-hi px-2.5 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.07)]">
      <p className="truncate text-[11px] font-medium text-body">
        {point.name || t('sessions.untitled')}
      </p>
      <p className="mt-1.5 flex items-center justify-between gap-3.5 text-[11px] text-muted">
        {t('dashboard.stat.asked')}
        <span className="tnum font-mono text-body">{fmt.number(point.userMessages)}</span>
      </p>
      <p className="mt-0.75 flex items-center justify-between gap-3.5 text-[11px] text-muted">
        {t('dashboard.stat.answered')}
        <span className="tnum font-mono text-body">{fmt.number(point.assistantMessages)}</span>
      </p>
    </div>
  )
}

export default function VolumeChart({
  data,
  showAsked = true,
  showAnswered = true,
}: {
  data: ConversationMetric[]
  showAsked?: boolean
  showAnswered?: boolean
}) {
  const { t, fmt } = useTranslation()

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: 0 }}>
        {/* Horizontal rules only — vertical grid lines add noise without aiding
            comparison across a dense categorical axis. */}
        <CartesianGrid stroke="var(--color-line-faint)" vertical={false} />

        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tick={TICK}
          tickFormatter={(value: string) => truncate(value || t('sessions.untitled'), 14)}
        />
        <YAxis
          width={34}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={TICK}
          tickFormatter={(value: number) => fmt.number(value)}
        />

        <Tooltip
          content={ChartTooltip}
          cursor={{ fill: 'var(--color-surface-sunk)', fillOpacity: 0.6 }}
        />

        {showAnswered ? (
          <Bar
            dataKey="assistantMessages"
            fill="var(--color-chart-bar)"
            maxBarSize={26}
            isAnimationActive={false}
          />
        ) : null}

        {showAsked ? (
          <Line
            type="linear"
            dataKey="userMessages"
            stroke="var(--color-ink)"
            strokeWidth={1.6}
            dot={{ r: 2, strokeWidth: 0, fill: 'var(--color-ink)' }}
            activeDot={{ r: 3.2, strokeWidth: 0, fill: 'var(--color-ink)' }}
            isAnimationActive={false}
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
