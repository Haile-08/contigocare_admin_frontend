import { Link } from 'react-router-dom'

import { Page, PageHeader } from '@/app/layouts/Page'
import { paths } from '@/app/router/paths'
import { useAppDispatch } from '@/app/store/hooks'
import { useGetOverviewQuery } from '@/features/dashboard/api/dashboardApi'
import { StatCard } from '@/features/dashboard/ui/StatCard'
import { analysisDrawerToggled } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import type { TFunction, TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader, CardLink } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'

function percent(value: number): string {
  return `${(value * 100).toFixed(0)}%`
}

const VERDICT_TONE = {
  correct: 'positive',
  partially_correct: 'warning',
  incorrect: 'critical',
} as const

// Verdict and status arrive as strings from the API, so they are mapped to
// typed keys rather than interpolated into `t`. An unrecognised value falls
// back to showing itself, which is more useful than a blank cell when the
// backend adds a state the console has not learned yet.
const VERDICT_LABEL: Record<string, TranslationKey> = {
  correct: 'feedback.verdict.correct',
  partially_correct: 'feedback.verdict.partially_correct',
  incorrect: 'feedback.verdict.incorrect',
}

const STATUS_LABEL: Record<string, TranslationKey> = {
  succeeded: 'status.succeeded',
  failed: 'status.failed',
  blocked_by_redaction: 'status.blocked_by_redaction',
}

function verdictLabel(t: TFunction, verdict: string): string {
  const key = VERDICT_LABEL[verdict]
  return key ? t(key) : verdict
}

function statusLabel(t: TFunction, status: string): string {
  const key = STATUS_LABEL[status]
  return key ? t(key) : status
}

export function DashboardPage() {
  const { t, fmt } = useTranslation()
  const dispatch = useAppDispatch()
  const { data, isLoading, isError, error, refetch } = useGetOverviewQuery({ limit: 15 })

  if (isError) {
    return (
      <Page>
        <PageHeader title={t('dashboard.title')} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Page>
    )
  }

  const reviewed = data
    ? Object.values(data.verdict_breakdown).reduce((total, count) => total + count, 0)
    : 0

  return (
    <Page>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          // A drawer, not a destination: the overview stays where it is while
          // the analysis runs beside it.
          <Button onClick={() => dispatch(analysisDrawerToggled(true))}>
            {t('dashboard.newAnalysis')}
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* The redaction gate firing is a signal, not a statistic. If it is
              catching submissions, either the detector is missing patterns or
              operators are clicking through the review — both need a person. */}
          {data.blocked_count > 0 ? (
            <Alert tone="warning">
              {t('dashboard.blockedWarning', { count: String(data.blocked_count) })}
            </Alert>
          ) : null}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={t('dashboard.totalAnalyses')}
              value={String(data.total_analyses)}
              hint={t('dashboard.lastSevenDays', { count: String(data.analyses_last_7_days) })}
              icon="document"
            />
            <StatCard
              label={t('dashboard.patients')}
              value={String(data.distinct_patients)}
              icon="users"
            />
            <StatCard
              label={t('dashboard.successRate')}
              value={percent(data.success_rate)}
              hint={t('dashboard.successHint')}
              icon="check"
            />
            <StatCard
              label={t('dashboard.medianLatency')}
              value={`${(data.median_latency_ms / 1000).toFixed(1)}s`}
              hint={t('dashboard.latencyHint')}
              icon="clock"
            />
          </section>

          {/* The quality row. `accuracy` is the only number here that says
              whether the agent is any good, and it is meaningless without
              `review` beside it — 100% accuracy over two reviewed runs is not
              a result, so the two are shown together. */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <StatCard
              label={t('dashboard.accuracy')}
              value={reviewed > 0 ? percent(data.accuracy_rate) : '—'}
              hint={
                reviewed > 0
                  ? t('dashboard.accuracyHint', { count: String(reviewed) })
                  : t('dashboard.accuracyEmpty')
              }
              icon="spark"
            />
            <StatCard
              label={t('dashboard.reviewRate')}
              value={percent(data.review_rate)}
              hint={t('dashboard.reviewHint')}
              icon="pencil"
            />
            <StatCard
              label={t('dashboard.blocked')}
              value={String(data.blocked_count)}
              hint={t('dashboard.blockedHint')}
              icon="shield"
              tone={data.blocked_count > 0 ? 'critical' : 'default'}
            />
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_18rem]">
            <Card>
              <CardHeader
                title={t('dashboard.recent')}
                description={t('dashboard.recentHint')}
                action={<CardLink to={paths.policies}>{t('common.viewAll')}</CardLink>}
              />

              {data.recent.length === 0 ? (
                <EmptyState
                  title={t('dashboard.emptyTitle')}
                  description={t('dashboard.emptyDescription')}
                />
              ) : (
                <ul className="divide-y divide-line-soft">
                  {data.recent.map((run) => (
                    <li key={run.id}>
                      {/* Every row on this list is a stored analysis, so every
                          row opens it. */}
                      <Link
                        to={paths.policy(run.id)}
                        className="flex items-center justify-between gap-4 px-4.5 py-2.5 transition-colors hover:bg-surface-sunk"
                      >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12.5px] font-medium text-body">
                            {run.aseguradora ?? t('dashboard.unknownInsurer')}
                          </span>
                          {run.hallazgos_criticos > 0 ? (
                            <Badge tone="critical">
                              {t('dashboard.criticalFindings', {
                                count: String(run.hallazgos_criticos),
                              })}
                            </Badge>
                          ) : null}
                        </div>
                        <span className="truncate text-[11px] text-faint">
                          {t('dashboard.patientLabel', { id: run.patient_id })} ·{' '}
                          {fmt.relative(run.created_at)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {run.verdict ? (
                          <Badge
                            tone={
                              VERDICT_TONE[run.verdict as keyof typeof VERDICT_TONE] ?? 'neutral'
                            }
                          >
                            {verdictLabel(t, run.verdict)}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">{t('dashboard.awaitingReview')}</Badge>
                        )}
                        <span
                          className={cn(
                            'w-12 text-right text-[11px] tabular-nums',
                            run.status === 'succeeded' ? 'text-faint' : 'text-critical',
                          )}
                        >
                          {run.status === 'succeeded'
                            ? `${(run.latency_ms / 1000).toFixed(1)}s`
                            : statusLabel(t, run.status)}
                        </span>
                      </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title={t('dashboard.redactionTitle')}
                description={t('dashboard.redactionHint')}
              />

              {Object.keys(data.redaction_totals).length === 0 ? (
                <p className="px-4.5 pb-4 text-[11.5px] text-faint">{t('dashboard.noRedactions')}</p>
              ) : (
                <ul className="flex flex-col gap-1.5 px-4.5 pb-4">
                  {Object.entries(data.redaction_totals)
                    .sort(([, left], [, right]) => right - left)
                    .slice(0, 12)
                    .map(([category, count]) => (
                      <li
                        key={category}
                        className="flex items-baseline justify-between gap-3 text-[11.5px]"
                      >
                        <span className="truncate font-mono text-muted">{category}</span>
                        <span className="shrink-0 text-body tabular-nums">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </Page>
  )
}

export default DashboardPage
