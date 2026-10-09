import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Page, PageHeader } from '@/app/layouts/Page'
import { paths } from '@/app/router/paths'
import { useAppDispatch } from '@/app/store/hooks'
import { useListAnalysesQuery } from '@/features/analysis/api/analysisApi'
import type { DeletionReceipt } from '@/features/analysis/model/types'
import { analysisDrawerToggled } from '@/features/ui/model/uiSlice'
import { useTranslation } from '@/shared/i18n'
import type { TFunction, TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

const PAGE_SIZE = 25

/** Long enough that typing an eight-digit id is one request, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 300

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

function labelFor(t: TFunction, map: Record<string, TranslationKey>, value: string): string {
  const key = map[value]
  return key ? t(key) : value
}

/**
 * The policy list — the console's entry point for anything policy-shaped.
 *
 * A row carries the patient id, the insurer and the verdict, and nothing from
 * the document itself. That is not only a privacy position: a list is for
 * finding the right analysis, and a row that tries to summarise a policy is a
 * row nobody scans.
 *
 * The search filters server-side on the patient id, because the operator
 * arrives here holding one — "what did we say about this patient's cover" is
 * the question this screen exists to answer.
 */
export function PoliciesPage() {
  const { t, fmt } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  // Left behind by the detail screen when an analysis is erased there. It is
  // the only confirmation of an erasure the operator gets — the records it
  // describes are already gone, so there is nothing to check it against.
  const deletion = (location.state as { deletion?: DeletionReceipt } | null)?.deletion

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)

  // The field updates on every keystroke; the request does not. Without this a
  // six-character patient id is six round trips, five of which are answering a
  // question nobody asked.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isFetching, isError, error, refetch } = useListAnalysesQuery({
    limit: PAGE_SIZE,
    offset,
    patientId: query || undefined,
  })

  // Opens the wizard over this list rather than replacing it, so a cancelled
  // analysis puts the operator back on the page and the search they had.
  const analyzeButton = (
    <Button
      onClick={() => dispatch(analysisDrawerToggled(true))}
      leadingIcon={<Icon name="plus" className="size-3.5" strokeWidth={2} />}
    >
      {t('policies.analyze')}
    </Button>
  )

  if (isError) {
    return (
      <Page>
        <PageHeader title={t('policies.title')} actions={analyzeButton} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Page>
    )
  }

  const total = data?.total ?? 0
  const shown = data?.items.length ?? 0
  const hasMore = offset + shown < total

  return (
    <Page>
      <PageHeader
        title={t('policies.title')}
        description={t('policies.description')}
        actions={analyzeButton}
      />

      {deletion ? (
        <Alert tone="success" className="mb-3">
          {deletion.deleted_analyses === 1
            ? t('delete.deletedRun')
            : t('delete.deletedPatient', { count: String(deletion.deleted_analyses) })}
          {deletion.deleted_navigations > 0
            ? ` ${t('delete.navigationsIncluded', { count: String(deletion.deleted_navigations) })}`
            : ''}
        </Alert>
      ) : null}

      <Card>
        <div className="flex items-center gap-3 border-b border-line-soft px-4.5 py-3">
          <Input
            aria-label={t('policies.search')}
            placeholder={t('policies.searchPlaceholder')}
            className="h-8 px-2.5 text-[12px]"
            wrapperClassName="max-w-xs flex-1"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              // A new filter is a new result set; staying on page three of the
              // old one shows an empty list and looks like a bug.
              setOffset(0)
            }}
          />
          <span className="ml-auto text-[11.5px] text-faint tabular-nums">
            {isLoading ? '' : t('policies.count', { count: String(total) })}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-sm" />
            ))}
          </div>
        ) : shown === 0 ? (
          // Keyed off the query that produced this result, not what is in the
          // box — otherwise the copy describes a search that has not run yet.
          <EmptyState
            title={query ? t('policies.noMatchTitle') : t('policies.emptyTitle')}
            description={query ? t('policies.noMatchDescription') : t('policies.emptyDescription')}
            action={
              query ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setQuery('')
                  }}
                >
                  {t('policies.clearSearch')}
                </Button>
              ) : null
            }
          />
        ) : (
          <ul className={cn('divide-y divide-line-soft', isFetching && 'opacity-60')}>
            {data?.items.map((row) => (
              <li key={row.id}>
                {/* The whole row is the target. A "view" link at the end of a
                    row is a smaller thing to hit for no benefit — there is only
                    one thing a row can do. */}
                <button
                  type="button"
                  onClick={() => navigate(paths.policy(row.id))}
                  className="flex w-full items-center justify-between gap-4 px-4.5 py-2.5 text-left transition-colors hover:bg-surface-sunk"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-medium text-body">
                        {t('dashboard.patientLabel', { id: row.patient_id })}
                      </span>
                    </div>
                    <span className="truncate text-[11px] text-faint">
                      {row.aseguradora ?? t('dashboard.unknownInsurer')} ·{' '}
                      {fmt.relative(row.created_at)}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {row.verdict ? (
                      <Badge
                        tone={VERDICT_TONE[row.verdict as keyof typeof VERDICT_TONE] ?? 'neutral'}
                      >
                        {labelFor(t, VERDICT_LABEL, row.verdict)}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">{t('dashboard.awaitingReview')}</Badge>
                    )}
                    {row.status !== 'succeeded' ? (
                      <Badge tone="critical">{labelFor(t, STATUS_LABEL, row.status)}</Badge>
                    ) : null}
                    <Icon name="arrowRight" className="size-3.5 text-faint" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-3 border-t border-line-soft px-4.5 py-2.5">
            <span className="text-[11.5px] text-faint tabular-nums">
              {t('policies.range', {
                from: String(offset + 1),
                to: String(offset + shown),
                total: String(total),
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
              >
                {t('policies.previous')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasMore}
                onClick={() => setOffset((current) => current + PAGE_SIZE)}
              >
                {t('policies.next')}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </Page>
  )
}

export default PoliciesPage
