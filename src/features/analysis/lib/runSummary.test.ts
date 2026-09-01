import { describe, expect, it } from 'vitest'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import type { Analisis, AnalysisResult, Severidad } from '../model/types'
import {
  buildRunSummary,
  exportFileName,
  formatGeneratedAt,
  formatRunId,
  toCsv,
  toTabSeparated,
  urgencyLevel,
} from './runSummary'

/** Local time, so the assertions hold wherever the suite runs. */
const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

function makeAnalysis(overrides: Partial<Analisis> = {}): Analisis {
  return analisisSchema.parse({
    datos_poliza: { aseguradora: { valor: 'GNP', confianza: 'alta' } },
    coberturas: {},
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

function finding(severidad: Severidad) {
  return { severidad, categoria: 'cobertura', descripcion_es: 'x', description_en: 'x' }
}

describe('urgencyLevel', () => {
  it('reports the worst severity present', () => {
    const analysis = makeAnalysis({
      hallazgos: [finding('media'), finding('critica'), finding('alta')],
    })
    expect(urgencyLevel(analysis)).toBe('CRITICAL')
  })

  it('is not driven by the order the findings arrive in', () => {
    expect(urgencyLevel(makeAnalysis({ hallazgos: [finding('critica'), finding('media')] }))).toBe(
      'CRITICAL',
    )
    expect(urgencyLevel(makeAnalysis({ hallazgos: [finding('informativa'), finding('alta')] }))).toBe(
      'HIGH',
    )
  })

  it('calls a run with no findings INFO rather than blank', () => {
    expect(urgencyLevel(makeAnalysis({ hallazgos: [] }))).toBe('INFO')
  })
})

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
  it('builds the five identifying rows', () => {
    const rows = buildRunSummary(
      makeAnalysis({ hallazgos: [finding('critica')] }),
      makeMeta(),
    )

    expect(rows.map((row) => [row.key, row.value])).toEqual([
      ['patient', 'PAC-2026-0020'],
      ['insurer', 'GNP'],
      ['urgency', 'CRITICAL'],
      ['runId', '20260522_131210'],
      ['generatedAt', '2026-05-22 13:12'],
    ])
  })

  it('falls back to a dash where the agent found no insurer', () => {
    const analysis = makeAnalysis({
      datos_poliza: { aseguradora: { valor: null, confianza: 'no_encontrado' } },
    })
    expect(buildRunSummary(analysis, makeMeta())[1]?.value).toBe('—')
  })
})

describe('serialising', () => {
  const header = ['Campo', 'Valor'] as const
  const rows = [
    ['Paciente (ID)', 'PAC-2026-0020'],
    ['Aseguradora', 'GNP'],
  ] as const

  it('copies as two tab-separated columns, header first', () => {
    expect(toTabSeparated(header, rows)).toBe(
      'Campo\tValor\nPaciente (ID)\tPAC-2026-0020\nAseguradora\tGNP',
    )
  })

  it('quotes a CSV value that contains a comma or a quote', () => {
    const csv = toCsv(header, [['Aseguradora', 'GNP, S.A. "Grupo"']])
    expect(csv).toBe('Campo,Valor\r\nAseguradora,"GNP, S.A. ""Grupo"""')
  })

  it('names the file after the patient and the run', () => {
    expect(exportFileName(makeMeta())).toBe('PAC-2026-0020_20260522_131210.csv')
  })

  it('flattens a patient id that a filesystem would object to', () => {
    expect(exportFileName(makeMeta({ patient_id: 'PAC 2026/0020' }))).toBe(
      'PAC-2026-0020_20260522_131210.csv',
    )
  })

  it('falls back to the analysis id when there is no timestamp', () => {
    expect(exportFileName(makeMeta({ created_at: '' }))).toBe(
      'PAC-2026-0020_0f2b1c8e-0000-4000-8000-000000000001.csv',
    )
  })
})
