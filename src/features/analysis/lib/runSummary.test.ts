import { describe, expect, it } from 'vitest'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import type { Analisis, AnalysisResult } from '../model/types'
import { buildRunSummary, exportFileName, formatGeneratedAt, formatRunId } from './runSummary'

/** Local time, so the assertions hold wherever the suite runs. */
const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

function makeAnalysis(overrides: Partial<Analisis> = {}): Analisis {
  return analisisSchema.parse({
    identificacion: { aseguradora: { valor: 'GNP', confianza: 'alta' } },
    ...overrides,
  })
}

function makeMeta(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return analyzeResponseSchema.parse({
    analysis_id: '0f2b1c8e-0000-4000-8000-000000000001',
    patient_id: 'PAC-2026-0020',
    status: 'succeeded',
    created_at: RUN_AT,
    ...overrides,
  })
}

describe('run identifiers', () => {
  it('formats the run id and the generation date', () => {
    expect(formatRunId(RUN_AT)).toBe('20260522_131210')
    expect(formatGeneratedAt(RUN_AT)).toBe('2026-05-22 13:12')
  })

  it('returns null rather than a fabricated date when the timestamp is missing', () => {
    expect(formatRunId('')).toBeNull()
    expect(formatRunId('not a date')).toBeNull()
    expect(formatGeneratedAt('')).toBeNull()
  })
})

describe('buildRunSummary', () => {
  it('builds the four identifying rows', () => {
    const rows = buildRunSummary(makeAnalysis(), makeMeta())

    expect(rows.map((row) => [row.key, row.value])).toEqual([
      ['patient', 'PAC-2026-0020'],
      ['insurer', 'GNP'],
      ['runId', '20260522_131210'],
      ['generatedAt', '2026-05-22 13:12'],
    ])
  })

  it('falls back to a dash where the agent found no insurer', () => {
    const analysis = makeAnalysis({
      identificacion: { aseguradora: { valor: null, confianza: 'no_encontrado' } },
    })
    expect(buildRunSummary(analysis, makeMeta())[1]?.value).toBe('—')
  })
})

describe('exportFileName', () => {
  it('names the file after the patient and the run', () => {
    expect(exportFileName(makeMeta())).toBe('PAC-2026-0020_20260522_131210.pdf')
  })

  it('flattens a patient id that a filesystem would object to', () => {
    expect(exportFileName(makeMeta({ patient_id: 'PAC 2026/0020' }))).toBe(
      'PAC-2026-0020_20260522_131210.pdf',
    )
  })

  it('falls back to the analysis id when there is no timestamp', () => {
    expect(exportFileName(makeMeta({ created_at: '' }))).toBe(
      'PAC-2026-0020_0f2b1c8e-0000-4000-8000-000000000001.pdf',
    )
  })
})
