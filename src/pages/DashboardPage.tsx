import { Suspense, lazy, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { paths } from '@/app/router/paths'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useGetOverviewQuery } from '@/features/dashboard/api/metricsApi'
import { OpsRail } from '@/features/dashboard/ui/OpsRail'
import { RecentConversations } from '@/features/dashboard/ui/RecentConversations'
import { SeriesLegend } from '@/features/dashboard/ui/SeriesLegend'
import { StatCard } from '@/features/dashboard/ui/StatCard'
import { opsRailToggled, selectOpsRailOpen } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import { Card, CardLink } from '@/shared/ui/Card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Icon } from '@/shared/ui/Icon'
import { SelectChip } from '@/shared/ui/SelectChip'
import { Skeleton } from '@/shared/ui/Skeleton'

/**
 * Recharts is ~90 kB and only this card needs it. Loading it separately means
 * the KPI row and the rest of the dashboard paint immediately, with the chart
 * filling in a moment later behind its own skeleton.
 */
const VolumeChart = lazy(() => import('@/features/dashboard/ui/VolumeChart'))

/* ------------------------------------------------------------------ filters */

/**
 * How many conversations to read for the snapshot. This is a real cost, not a
 * display preference: each one is a request, so the control says what it does
 * and defaults low.
 */
const SAMPLES = ['6', '12', '24'] as const
type Sample = (typeof SAMPLES)[number]

const isSample = (value: string | null): value is Sample =>
  SAMPLES.some((sample) => sample === value)

/* ---------------------------------------------------------------- dashboard */

/**
 * The console's front page.
 *
 * Two columns that scroll independently: the numbers on the left, the day's
 * work on the right. Both fill the shell's height rather than growing it, so
 * the chart and the rail are visible together on a laptop instead of the rail
 * being buried under a scroll.
 *
 * The sample control is real, not decorative — it is how many transcripts get
 * read, and every number on the screen is counted from exactly that set. It
 * lives in the URL because it is view state: a link to this screen carries the
 * sample with it, and Back steps through the sizes you looked at.
 */
export function DashboardPage() {
  const dispatch = useAppDispatch()
  const railOpen = useAppSelector(selectOpsRailOpen)
  const { t, fmt } = useTranslation()

  const [searchParams, setSearchParams] = useSearchParams()
  const sampleParam = searchParams.get('sample')
  const sample: Sample = isSample(sampleParam) ? sampleParam : '12'

  // Hiding a series is a view of the chart, not an addressable state — a link
  // to "the dashboard with one series turned off" isn't a thing anyone wants.
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const toggleSeries = (id: string): void => {
    setHidden((current) => ({ ...current, [id]: !current[id] }))
  }

  const overview = useGetOverviewQuery({ sample: Number(sample) })
  const data = overview.data

  const sampleOptions = useMemo(
    () =>
      SAMPLES.map((value) => ({
        value,
        label: t('dashboard.sampleOption', { count: Number(value) }),
      })),
    [t],
  )

  const scope = data
    ? t('dashboard.stat.messagesCaption', {
        sampled: fmt.number(data.sampled),
        total: fmt.number(data.conversations),
      })
    : undefined

  const chartRows = (data?.rows ?? []).filter((row) => !row.unavailable).slice(0, 12)

  return (
    <div className="flex h-full min-h-0">
      <div className="scroll-slim min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pt-5 pb-12 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] leading-none font-medium tracking-[-0.015em] text-body">
              {t('dashboard.title')}
            </h1>
            {/* The one number that means "act now" sits next to the title, not
                in a tile — it's a state, not a measure. */}
            {data && data.empty > 0 ? (
              <Link
                to={paths.chat}
                className="flex items-center gap-1.5 rounded-full border border-line px-2.25 py-0.75 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-body"
              >
                <span aria-hidden="true" className="size-1.25 rounded-full bg-warning" />
                {t('dashboard.emptyCount', { count: data.empty })}
              </Link>
            ) : null}
            {data && data.active > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-line px-2.25 py-0.75 text-[11px] text-muted">
                <span aria-hidden="true" className="size-1.25 rounded-full bg-brand" />
                {t('dashboard.activeCount', { count: data.active })}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <SelectChip
              label={t('dashboard.sampleSize')}
              icon="list"
              value={sample}
              options={sampleOptions}
              onChange={(value) => {
                setSearchParams(
                  (current) => {
                    const next = new URLSearchParams(current)
                    next.set('sample', value)
                    return next
                  },
                  { replace: true },
                )
              }}
            />
            {railOpen ? null : (
              <button
                type="button"
                onClick={() => dispatch(opsRailToggled(true))}
                className="hidden h-8.5 items-center gap-1.75 rounded-[9px] border border-line-soft bg-surface px-2.5 text-[12px] text-mid transition-colors hover:border-line-strong hover:bg-canvas xl:flex"
              >
                <Icon name="panel" className="size-3.25" strokeWidth={1.7} />
                {t('dashboard.showPanel')}
              </button>
            )}
          </div>
        </div>

        {overview.error ? (
          <Card>
            <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <StatCard
              label={t('dashboard.stat.conversations')}
              icon="chat"
              isLoading={overview.isLoading}
              value={data ? fmt.number(data.conversations) : '—'}
              caption={
                data?.partial
                  ? t('dashboard.stat.conversationsCaptionPartial', {
                      count: fmt.number(data.sampled),
                    })
                  : t('dashboard.stat.conversationsCaptionAll')
              }
              action={{ to: paths.chat, label: t('dashboard.stat.openConversations') }}
            />
            <StatCard
              label={t('dashboard.stat.messages')}
              icon="message"
              isLoading={overview.isLoading}
              value={data ? fmt.number(data.messages) : '—'}
              {...(scope ? { caption: scope } : {})}
              action={{ to: paths.chat, label: t('dashboard.stat.readThreads') }}
            />
            <StatCard
              label={t('dashboard.stat.asked')}
              icon="user"
              isLoading={overview.isLoading}
              value={data ? fmt.number(data.userMessages) : '—'}
              caption={t('dashboard.stat.askedCaption')}
              action={{ to: paths.chat, label: t('dashboard.stat.openConversations') }}
            />
            <StatCard
              label={t('dashboard.stat.answered')}
              icon="spark"
              isLoading={overview.isLoading}
              value={data ? fmt.number(data.assistantMessages) : '—'}
              caption={t('dashboard.stat.answeredCaption')}
              action={{ to: paths.chat, label: t('dashboard.stat.openConversations') }}
            />
            <StatCard
              label={t('dashboard.stat.average')}
              icon="chart"
              isLoading={overview.isLoading}
              value={data ? fmt.decimal(data.averageMessages) : '—'}
              caption={t('dashboard.stat.averageCaption')}
              action={{ to: paths.chat, label: t('dashboard.stat.openConversations') }}
            />
          </div>
        )}

        <Card className="mt-3 pt-4 pb-2.5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3 px-4.5">
            <div className="flex items-center gap-3.5">
              <h2 className="text-[13.5px] font-medium text-body">{t('dashboard.chart.title')}</h2>
              <SeriesLegend
                series={[
                  {
                    id: 'asked',
                    name: t('dashboard.stat.asked'),
                    mark: 'line',
                    visible: !hidden['asked'],
                  },
                  {
                    id: 'answered',
                    name: t('dashboard.stat.answered'),
                    mark: 'bar',
                    visible: !hidden['answered'],
                  },
                ]}
                onToggle={toggleSeries}
              />
            </div>
            <CardLink to={paths.chat}>{t('dashboard.stat.openConversations')}</CardLink>
          </div>

          <div className="px-1.5">
            {overview.error ? (
              <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
            ) : overview.isLoading ? (
              <Skeleton className="mx-3 h-60 w-[calc(100%-1.5rem)]" />
            ) : chartRows.length === 0 ? (
              <p className="py-20 text-center text-[11.5px] text-muted">
                {t('dashboard.chart.empty')}
              </p>
            ) : (
              <Suspense fallback={<Skeleton className="mx-3 h-60 w-[calc(100%-1.5rem)]" />}>
                <VolumeChart
                  data={chartRows}
                  showAsked={!hidden['asked']}
                  showAnswered={!hidden['answered']}
                />
              </Suspense>
            )}
          </div>
        </Card>

        <Card className="mt-3 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4.5 pt-3.5 pb-3">
            <h2 className="text-[13.5px] font-medium text-body">{t('dashboard.busiest')}</h2>
            <CardLink to={paths.chat}>{t('common.viewAll')}</CardLink>
          </div>

          {overview.error ? null : (
            <RecentConversations
              rows={data?.rows.slice(0, 6)}
              isLoading={overview.isLoading}
            />
          )}
        </Card>
      </div>

      {/*
       * Below xl there isn't room for a second column, so the rail drops out
       * entirely rather than squeezing the chart — everything in it is reachable
       * from the screens it links to.
       */}
      {railOpen ? (
        <div className="hidden h-full shrink-0 xl:block">
          <OpsRail overview={data} isLoading={overview.isLoading} />
        </div>
      ) : null}
    </div>
  )
}

export default DashboardPage
