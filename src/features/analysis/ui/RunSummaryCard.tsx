import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { logger } from '@/shared/lib/logger'
import { Badge } from '@/shared/ui/Badge'
import type { BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'

import {
  CSV_BOM,
  buildRunSummary,
  exportFileName,
  toCsv,
  toTabSeparated,
} from '../lib/runSummary'
import type { ExportRow, UrgencyLevel } from '../lib/runSummary'
import type { Analisis, AnalysisResult } from '../model/types'

const URGENCY_TONE: Record<UrgencyLevel, BadgeTone> = {
  CRITICAL: 'critical',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  INFO: 'info',
}

/**
 * The identifying header of a finished analysis, above the summary.
 *
 * The summary is not read here — it is copied out of the console and handed to
 * a broker — and a paragraph about a policy is only useful to that reader if it
 * arrives attached to the patient, the insurer, the urgency and the run that
 * produced it. So the facts that answer "which analysis is this?" sit directly
 * above the text they qualify, and both leave together: **Copy** puts the table
 * on the clipboard as two tab-separated columns (Excel, Sheets and Outlook all
 * paste that as a table), **Download CSV** writes the same rows to a file named
 * after the run.
 *
 * It is a real `<table>`, not a styled grid, so a manual drag-select copies as
 * a table too — the operator who ignores both buttons still gets structured
 * columns rather than one run-on line.
 */
export function RunSummaryCard({ analysis, meta }: { analysis: Analisis; meta: AnalysisResult }) {
  const { t } = useTranslation()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const rows = buildRunSummary(analysis, meta)
  const header: ExportRow = [t('runSummary.field'), t('runSummary.value')]
  const exportRows: ExportRow[] = rows.map((row) => [t(row.label), row.value])

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(toTabSeparated(header, exportRows))
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      // Clipboard access can be denied outright, and an insecure origin has no
      // clipboard at all. The table is on screen and selectable, so say that
      // rather than failing silently.
      setCopyState('failed')
    }
  }

  const handleDownload = (): void => {
    const blob = new Blob([CSV_BOM + toCsv(header, exportRows)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)

    try {
      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName(meta)
      link.click()
    } catch (error) {
      logger.error('run_summary_download_failed', { error })
    } finally {
      // Revoking on the next tick rather than immediately: the click is
      // synchronous but the browser reads the URL after this frame, and a
      // revoked blob downloads as a zero-byte file in Safari.
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }
  }

  return (
    <Card>
      <CardHeader
        title={t('runSummary.title')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleCopy()}
              leadingIcon={
                <Icon name={copyState === 'copied' ? 'check' : 'copy'} className="size-3.5" />
              }
            >
              {copyState === 'copied' ? t('runSummary.copied') : t('runSummary.copy')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              leadingIcon={<Icon name="download" className="size-3.5" />}
            >
              {t('runSummary.download')}
            </Button>
          </div>
        }
      />

      <div className="px-4.5 pb-4">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-soft">
              <th
                scope="col"
                className="w-1/2 py-1.5 text-[10.5px] font-normal tracking-wide text-faint uppercase"
              >
                {header[0]}
              </th>
              <th
                scope="col"
                className="py-1.5 text-[10.5px] font-normal tracking-wide text-faint uppercase"
              >
                {header[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line-soft last:border-b-0">
                <th
                  scope="row"
                  className="py-2 text-[11.5px] font-normal text-muted"
                >
                  {t(row.label)}
                </th>
                <td className="py-2 text-[12.5px] font-medium text-body">
                  {row.key === 'urgency' ? (
                    <Badge tone={URGENCY_TONE[row.value as UrgencyLevel]}>{row.value}</Badge>
                  ) : (
                    // Selectable as a unit: these are values people quote, and
                    // a double-click that grabs the whole id saves a drag.
                    <span
                      className={
                        row.key === 'patient' || row.key === 'runId'
                          ? 'font-mono text-[12px] select-all'
                          : 'select-all'
                      }
                    >
                      {row.value}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {copyState === 'failed' ? (
          <p role="status" className="mt-2 text-[11px] text-critical">
            {t('runSummary.copyFailed')}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
