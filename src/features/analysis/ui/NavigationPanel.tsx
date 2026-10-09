import { useState } from 'react'

import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { logger } from '@/shared/lib/logger'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'
import { Spinner } from '@/shared/ui/Spinner'

import {
  useDownloadNavigationFileMutation,
  useGetNavigationQuery,
  useRunNavigationMutation,
} from '../api/analysisApi'
import { initialIntakeForm, localToday, toIntakePayload } from '../lib/navigationIntake'
import type { IntakeForm } from '../lib/navigationIntake'
import { AGENT_LABEL, AGENT_ORDER } from '../model/navigation'
import type { AgentKey, NavigationFileKind, NavigationRun } from '../model/navigation'
import type { Analisis } from '../model/types'
import { NavigationFeedbackPanel } from './NavigationFeedbackPanel'
import { NavigationIntakeForm } from './NavigationIntakeForm'
import { NavigationReport } from './NavigationReport'

/** How often a running navigation is re-read. The agents take minutes; a few seconds is plenty. */
const POLL_INTERVAL_MS = 4000

interface NavigationPanelProps {
  analysisId: string
  analysis: Analisis
  /** The latest stored navigation, when the analysis already has one. */
  existing?: NavigationRun | null
}

type AgentState = 'done' | 'running' | 'pending' | 'skipped'

/** Where each agent stands, from the run's intake and the agent at work. */
function agentStates(run: NavigationRun): [AgentKey, AgentState][] {
  const current = AGENT_ORDER.indexOf((run.current_agent ?? 'parser') as AgentKey)
  const skips: Partial<Record<AgentKey, boolean>> = {
    notification: run.intake['notification_sent'] === true,
    advocate: !run.intake['denial_reason'],
  }
  return AGENT_ORDER.map((agent, index) => {
    if (index === current) return [agent, 'running']
    if (skips[agent]) return [agent, 'skipped']
    return [agent, index < current ? 'done' : 'pending']
  })
}

function Progress({ run, pollFailed }: { run: NavigationRun; pollFailed: boolean }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader title={t('navigation.runningTitle')} description={t('navigation.runningHint')} />
      <ol className="flex flex-col gap-1 px-4.5 pb-4.5">
        {agentStates(run).map(([agent, state]) => (
          <li
            key={agent}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xs px-2 py-1.5 text-[12px]',
              state === 'running' ? 'bg-surface-sunk text-body' : 'text-muted',
            )}
          >
            <span className="flex items-center gap-2">
              {state === 'running' ? <Spinner /> : state === 'done' ? <Icon name="check" className="size-3.5" /> : null}
              {t(AGENT_LABEL[agent])}
            </span>
            <span className="text-[11px]">{t(`navigation.agentState.${state}`)}</span>
          </li>
        ))}
      </ol>
      {pollFailed ? (
        <div className="px-4.5 pb-4">
          <Alert tone="warning">{t('navigation.pollError')}</Alert>
        </div>
      ) : null}
    </Card>
  )
}

/**
 * InnovaDerm Navigator for one analysis: the intake, the run, the report.
 *
 * Shared by the wizard's last step and the policy detail screen, so a navigation
 * started right after an analysis and one re-run a week later — usually because
 * a denial arrived — are the same screen. The server runs the agents in the
 * background; this polls the run until it finishes, and a run left running when
 * the screen closed is picked up again when it reopens.
 */
export function NavigationPanel({ analysisId, analysis, existing }: NavigationPanelProps) {
  const { t } = useTranslation()
  const [runId, setRunId] = useState<string | null>(existing?.navigation_id ?? null)
  const [editing, setEditing] = useState(!existing)
  const [error, setError] = useState<string | null>(null)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const [start, { isLoading: isStarting }] = useRunNavigationMutation()
  const [download, { isLoading: isDownloading }] = useDownloadNavigationFileMutation()

  const [running, setRunning] = useState(existing?.status === 'running')
  const polled = useGetNavigationQuery(runId ?? '', {
    skip: runId === null,
    pollingInterval: running ? POLL_INTERVAL_MS : 0,
  })
  const run: NavigationRun | null = polled.data ?? existing ?? null
  // Stop polling as soon as the run leaves `running`. Set during render rather
  // than in an effect: the next poll must not be scheduled at all.
  if (running && polled.data && polled.data.status !== 'running') setRunning(false)

  const handleSubmit = async (form: IntakeForm): Promise<void> => {
    setError(null)
    try {
      const started = await start({ analysisId, intake: toIntakePayload(form) }).unwrap()
      setRunId(started.navigation_id)
      setRunning(started.status === 'running')
      setEditing(false)
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
    }
  }

  const handleDownload = async (current: NavigationRun, kind: NavigationFileKind): Promise<void> => {
    let url: string | null = null
    try {
      const file = await download({ navigationId: current.navigation_id, kind }).unwrap()
      url = file.url
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.filename || `${current.patient_id}-${kind}${kind === 'report' ? '.pdf' : '.zip'}`
      link.click()
      setDownloadFailed(false)
    } catch (caught) {
      logger.error('navigation_download_failed', { kind, error: caught })
      setDownloadFailed(true)
    } finally {
      // Next tick: Safari saves a zero-byte file when the URL is revoked in the
      // same frame as the click.
      if (url) {
        const created = url
        setTimeout(() => URL.revokeObjectURL(created), 0)
      }
    }
  }

  const finished = run && run.status === 'succeeded'

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {editing ? (
        <NavigationIntakeForm
          // Remount with the latest intake when re-running after a new result.
          key={run?.navigation_id ?? 'new'}
          initial={initialIntakeForm(analysis, localToday(), run?.intake)}
          isSubmitting={isStarting}
          submitLabel={run ? t('navigation.rerun') : t('navigation.run')}
          onSubmit={(form) => void handleSubmit(form)}
          onCancel={run ? () => setEditing(false) : undefined}
        />
      ) : run ? (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {downloadFailed ? (
              <span className="text-[11px] text-critical">{t('navigation.downloadFailed')}</span>
            ) : null}
            {finished ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isDownloading}
                  onClick={() => void handleDownload(run, 'report')}
                  leadingIcon={<Icon name="download" className="size-3.5" />}
                >
                  {t('navigation.downloadReport')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isDownloading}
                  onClick={() => void handleDownload(run, 'broker-kit')}
                  leadingIcon={<Icon name="download" className="size-3.5" />}
                >
                  {t('navigation.downloadKit')}
                </Button>
              </>
            ) : null}
            {run.status !== 'running' ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                {t('navigation.editIntake')}
              </Button>
            ) : null}
          </div>

          {run.status === 'running' ? (
            <Progress run={run} pollFailed={polled.isError} />
          ) : run.status === 'failed' ? (
            <Alert tone="error">{t('navigation.failed', { error: run.error ?? '' })}</Alert>
          ) : run.status === 'blocked_by_redaction' ? (
            <Alert tone="error">{t('navigation.blocked')}</Alert>
          ) : (
            <>
              <NavigationReport run={run} />
              {/* Keyed on the run: a re-run is a new report and a new review. */}
              <NavigationFeedbackPanel key={run.navigation_id} run={run} />
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
