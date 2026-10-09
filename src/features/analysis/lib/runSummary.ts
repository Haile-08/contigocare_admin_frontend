import type { TranslationKey } from '@/shared/i18n'

import type { Analisis, AnalysisResult } from '../model/types'

/**
 * The four facts that identify a finished run.
 *
 * These are the header of an outward-facing document: the extraction below them
 * leaves the console and is sent on to a broker, and a table of policy terms is
 * worth very little without *which* patient, *which* insurer and *which* run
 * produced it. So the identifying fields are built once, here, in a shape that
 * renders and exports identically — the screen and the PDF in the broker's
 * inbox cannot disagree about the run they describe, because there is one
 * function that decides it.
 *
 * Everything in this module is pure. The download lives in the component; the
 * strings it carries are built and tested here.
 */

/** Shown where a value is genuinely absent, rather than an empty cell. */
export const PLACEHOLDER = '—'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function parseTimestamp(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * The run's human identifier: `20260522_131210`.
 *
 * Sortable, quotable over the phone, and unique in practice at one-second
 * resolution for one console. The analysis id is the primary key and stays the
 * thing the URL and the feedback record use — this is the one an operator reads
 * out. Rendered in the viewer's own timezone, like every other time in the app,
 * so it matches the generation date sitting next to it.
 */
export function formatRunId(createdAt: string): string | null {
  const date = parseTimestamp(createdAt)
  if (!date) return null

  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

/**
 * `2026-05-22 13:16`.
 *
 * Fixed rather than locale-formatted: this row is read off an exported file as
 * often as off the screen, and
 * `22/05/2026` versus `5/22/2026` is a date two readers can disagree about.
 */
export function formatGeneratedAt(createdAt: string): string | null {
  const date = parseTimestamp(createdAt)
  if (!date) return null

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export interface RunSummaryRow {
  key: 'patient' | 'insurer' | 'runId' | 'generatedAt'
  label: TranslationKey
  value: string
}

/**
 * The header rows, in the order they are read.
 *
 * Patient and insurer first because they say what the document is about; the
 * run id and date last because they are what you quote when asking about it
 * later.
 */
export function buildRunSummary(analysis: Analisis, meta: AnalysisResult): RunSummaryRow[] {
  const insurer = analysis.identificacion['aseguradora']?.valor?.trim()

  return [
    { key: 'patient', label: 'runSummary.patient', value: meta.patient_id || PLACEHOLDER },
    { key: 'insurer', label: 'runSummary.insurer', value: insurer || PLACEHOLDER },
    { key: 'runId', label: 'runSummary.runId', value: formatRunId(meta.created_at) ?? PLACEHOLDER },
    {
      key: 'generatedAt',
      label: 'runSummary.generatedAt',
      value: formatGeneratedAt(meta.created_at) ?? PLACEHOLDER,
    },
  ]
}

/** `PAC-2026-0020_20260522_131210.pdf`, with anything a filesystem dislikes flattened. */
export function exportFileName(meta: AnalysisResult, extension = 'pdf'): string {
  const patient = meta.patient_id.replaceAll(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
  const stamp = formatRunId(meta.created_at) ?? meta.analysis_id

  return `${patient || 'analisis'}_${stamp}.${extension}`
}
