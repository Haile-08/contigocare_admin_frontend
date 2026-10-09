import { describe, expect, it } from 'vitest'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import type { Analisis, AnalysisResult } from '../model/types'
import { buildPolicyExtraction, extractionDate, extractionScore } from './policyExtraction'

const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

function found(valor: string) {
  return { valor, confianza: 'alta', evidencia: `…${valor}…` }
}

function makeAnalysis(overrides: Record<string, unknown> = {}): Analisis {
  return analisisSchema.parse({
    identificacion: {
      aseguradora: found('GNP'),
      vigencia_inicio: found('30/05/2025'),
    },
    estructura_financiera: {
      deducible: found('$19,500.00'),
      coaseguro_porcentaje: found('10%'),
      tope_coaseguro: found('$68,000.00'),
    },
    preexistencias_continuidad: {
      antiguedad: { valor: null, confianza: 'no_encontrado' },
    },
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

describe('buildPolicyExtraction', () => {
  it('groups the values the navigation intake starts from', () => {
    const groups = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(groups.map((group) => group.key)).toEqual(['identification', 'financial', 'preexisting'])
  })

  it('states the insurer, the policy year and the money the policy actually says', () => {
    const [identification, financial, preexisting] = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(identification?.rows.map((row) => [row.key, row.value])).toEqual([
      ['aseguradora', 'GNP'],
      ['vigencia_inicio', '30/05/2025'],
      // The derived rows close the group, after everything read from the policy.
      ['confianza', '83%'],
      ['fechaExtraccion', '2026-05-22'],
    ])
    expect(financial?.rows.map((row) => [row.key, row.value])).toEqual([
      ['deducible', '$19,500.00'],
      ['coaseguro_porcentaje', '10%'],
      ['tope_coaseguro', '$68,000.00'],
    ])
    // A field the agent could not find is printed as a dash, not dropped: the
    // coordinator has to type the antigüedad into the intake themselves.
    expect(preexisting?.rows.map((row) => [row.key, row.value])).toEqual([['antiguedad', '—']])
  })

  it('keeps the quote on an extracted row and withholds one from a derived row', () => {
    const [identification] = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(identification?.rows[0]?.campo?.evidencia).toBe('…GNP…')
    // The extraction score and the run date are computed here, not read from
    // the policy — a citation on them would be fabricated.
    for (const row of identification?.rows.slice(-2) ?? []) {
      expect(row.campo).toBeNull()
    }
  })

  it('renders a run stored under the wider v2 schema with only the fields still read', () => {
    const v2 = analisisSchema.parse({
      identificacion: { aseguradora: found('AXA'), registro_cnsf: found('CNSF-S0025-0123-2019') },
      alcance_cobertura: { biologicos_cubiertos: found('Sí') },
      hallazgos: [{ severidad: 'critica', categoria: 'x', descripcion_es: 'x', description_en: 'x' }],
    })
    const groups = buildPolicyExtraction(v2, makeMeta())

    expect(groups.find((group) => group.key === 'identification')?.rows.map((row) => row.key)).toEqual([
      'aseguradora',
      'vigencia_inicio',
      'confianza',
      'fechaExtraccion',
    ])
    expect(groups.find((group) => group.key === 'financial')?.rows).toEqual([])
  })

  it('renders a run stored under the v1 schema, with empty groups', () => {
    // Sections the v1 runs carried under other names are stripped on parse, so
    // every group arrives empty rather than half-populated.
    const legacy = analisisSchema.parse({
      datos_poliza: { aseguradora: found('AXA') },
      coberturas: { deducible: found('$19,500.00') },
    })
    const groups = buildPolicyExtraction(legacy, makeMeta())

    expect(groups.find((group) => group.key === 'financial')?.rows).toEqual([])
    // Only the two derived rows survive, and the score says nothing rather
    // than claiming a confident zero.
    expect(
      groups.find((group) => group.key === 'identification')?.rows.map((row) => row.value),
    ).toEqual(['—', '2026-05-22'])
  })
})

describe('extractionScore', () => {
  it('weighs each field by its own confidence', () => {
    const analysis = analisisSchema.parse({
      identificacion: { aseguradora: found('GNP'), vigencia_inicio: { valor: 'x', confianza: 'media' } },
    })
    // 1 + 0.6 over two fields.
    expect(extractionScore(analysis)).toBe(80)
  })

  it('counts a field the agent looked for and did not find', () => {
    const analysis = analisisSchema.parse({
      identificacion: {
        aseguradora: found('GNP'),
        vigencia_inicio: { valor: null, confianza: 'no_encontrado' },
      },
    })
    expect(extractionScore(analysis)).toBe(50)
  })

  it('says nothing rather than 0% when there are no fields at all', () => {
    expect(extractionScore(analisisSchema.parse({}))).toBeNull()
  })
})

describe('extractionDate', () => {
  it('is the run date, without the time', () => {
    expect(extractionDate(RUN_AT)).toBe('2026-05-22')
  })

  it('does not invent a date when the timestamp is missing', () => {
    expect(extractionDate('')).toBe('—')
  })
})
