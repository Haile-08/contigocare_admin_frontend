import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Page, PageHeader } from '@/app/layouts/Page'
import { paths } from '@/app/router/paths'
import { useGetAnalysisQuery } from '@/features/analysis/api/analysisApi'
import { AnalysisView } from '@/features/analysis/ui/AnalysisView'
import { DeleteAnalysisDialog } from '@/features/analysis/ui/DeleteAnalysisDialog'
import { FeedbackPanel } from '@/features/analysis/ui/FeedbackPanel'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Icon } from '@/shared/ui/Icon'
import { Skeleton } from '@/shared/ui/Skeleton'

type Tab = 'analysis' | 'policy'

const STATUS_LABEL: Record<string, TranslationKey> = {
  succeeded: 'status.succeeded',
  failed: 'status.failed',
  blocked_by_redaction: 'status.blocked_by_redaction',
}

/**
 * One saved policy: what was sent, what came back, and what the reviewer made
 * of it.
 *
 * The "policy" tab shows `redacted_text` — the *only* form of the document that
 * outlives the request that created it. That is the honest thing to show: it is
 * exactly what the model was given, so a reviewer questioning a figure is
 * reading the same text the agent read, not a reconstruction of it. The
 * original upload was parsed in memory and dropped and cannot be shown here,
 * which is the product working as designed.
 *
 * The verdict is editable. A review recorded in a hurry at the end of the
 * wizard is the one most likely to need correcting, and the only place to do
 * that is here.
 *
 * So is erasure, and for the same reason: this is the screen that shows what is
 * held on a patient, so it is the screen that has to be able to remove it.
 */
export function PolicyDetailPage() {
  const { t, fmt } = useTranslation()
  const { analysisId = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('analysis')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Set the moment the erasure succeeds. Deleting invalidates this analysis's
  // cache entry, so the detail query refetches a run that no longer exists —
  // without this flag the screen flashes a 404 error state on its way out.
  const [deleted, setDeleted] = useState(false)

  const { data, isLoading, isError, error, refetch } = useGetAnalysisQuery(analysisId, {
    skip: analysisId === '' || deleted,
  })

  if (isError && !deleted) {
    return (
      <Page>
        <PageHeader title={t('policyDetail.title')} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Page>
    )
  }

  if (isLoading || !data) {
    return (
      <Page>
        <PageHeader title={t('policyDetail.title')} />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </Page>
    )
  }

  const statusKey = STATUS_LABEL[data.status]

  return (
    <Page>
      <PageHeader
        title={t('analysis.forPatient', { id: data.patient_id })}
        description={t('policyDetail.ranAt', {
          when: fmt.relative(data.created_at),
          pages: String(data.page_count),
        })}
        actions={
          <div className="flex items-center gap-3">
            <Link
              to={paths.policies}
              className="text-[12px] text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
            >
              {t('policyDetail.backToList')}
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              leadingIcon={<Icon name="trash" className="size-3.5" />}
              className="text-critical hover:text-critical"
            >
              {t('delete.action')}
            </Button>
          </div>
        }
      />

      <DeleteAnalysisDialog
        open={confirmingDelete}
        analysisId={data.analysis_id}
        patientId={data.patient_id}
        patientAnalysisCount={data.patient_analysis_count}
        onClose={() => setConfirmingDelete(false)}
        onDeleted={(receipt) => {
          setDeleted(true)
          setConfirmingDelete(false)
          // `replace`, so Back does not return to a policy that no longer
          // exists. The receipt travels with the navigation because the list is
          // where the operator lands and the only place left to confirm what
          // was removed.
          navigate(paths.policies, { replace: true, state: { deletion: receipt } })
        }}
      />

      <div className="flex flex-col gap-4">
        {data.status !== 'succeeded' ? (
          <Alert tone="error">
            {statusKey ? t(statusKey) : data.status}
            {data.result ? '' : ` · ${t('policyDetail.noResult')}`}
          </Alert>
        ) : null}

        {/* Two views of one run, not two screens: the analysis and the text it
            came from belong beside each other, and a tab keeps the long
            document out of the way until someone wants to check a quote. */}
        <div className="flex items-center gap-1 border-b border-line">
          {(['analysis', 'policy'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              aria-current={tab === option ? 'true' : undefined}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-[12.5px] transition-colors',
                tab === option
                  ? 'border-ink font-medium text-body'
                  : 'border-transparent text-muted hover:text-body',
              )}
            >
              {option === 'analysis' ? t('policyDetail.tabAnalysis') : t('policyDetail.tabPolicy')}
            </button>
          ))}
        </div>

        {tab === 'analysis' ? (
          data.result ? (
            <>
              <AnalysisView analysis={data.result} meta={data} />

              {/* Keyed on the analysis so switching rows remounts the form with
                  the new verdict rather than carrying the previous one over. */}
              <FeedbackPanel
                key={data.analysis_id}
                analysisId={data.analysis_id}
                analysis={data.result}
                existing={data.feedback}
              />
            </>
          ) : (
            <Card>
              <div className="p-4">
                <Alert tone="warning">{t('policyDetail.noResult')}</Alert>
              </div>
            </Card>
          )
        ) : (
          <Card>
            <CardHeader
              title={t('policyDetail.tabPolicy')}
              description={t('policyDetail.policyHint')}
              action={
                <Badge tone="neutral">
                  {t('policyDetail.charCount', {
                    count: fmt.number(data.redacted_char_count),
                  })}
                </Badge>
              }
            />

            {Object.keys(data.redaction_summary).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 px-4.5 pb-3">
                {Object.entries(data.redaction_summary)
                  .sort(([, left], [, right]) => right - left)
                  .map(([category, count]) => (
                    <Badge key={category} tone="brand">
                      {category} · {count}
                    </Badge>
                  ))}
              </div>
            ) : null}

            <div className="max-h-[60vh] overflow-auto border-t border-line-soft px-4.5 py-3 font-mono text-[11.5px] leading-[1.7] whitespace-pre-wrap text-body">
              {data.redacted_text || t('policyDetail.noText')}
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}

export default PolicyDetailPage
