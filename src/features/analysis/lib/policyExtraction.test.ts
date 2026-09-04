import { describe, expect, it } from 'vitest'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import type { Analisis, AnalysisResult } from '../model/types'
import {
  buildPolicyExtraction,
  extractionDate,
  extractionScore,
  policyPeriod,
} from './policyExtraction'

const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

function found(valor: string) {
  return { valor, confianza: 'alta', evidencia: `…${valor}…` }
}

function makeAnalysis(overrides: Record<string, unknown> = {}): Analisis {
  return analisisSchema.parse({
    identificacion: {
      aseguradora: found('GNP'),
      tipo_poliza: found('Colectivo'),
      moneda: found('MXN'),
      vigencia_inicio: found('30/05/2025'),
      vigencia_fin: found('30/05/2026'),
      registro_cnsf: found('CNSF-S0025-0123-2019'),
    },
    estructura_financiera: {
      deducible: found('$19,500.00'),
      tipo_deducible: found('Única por padecimiento'),
      coaseguro_porcentaje: found('10%'),
      tope_coaseguro: found('$68,000.00'),
      suma_asegurada: found('$2,120,000.00'),
      tope_honorarios_medicos: found('$210,000.00'),
    },
    alcance_cobertura: {
      biologicos_cubiertos: { valor: null, confianza: 'no_encontrado' },
      medicamentos_especialidad_cubiertos: found('Sí'),
      modelo_red: found('Red obligatoria'),
      cobertura_eua: found('No'),
    },
    exclusiones_limitaciones: {
      edad_maxima_permanencia: found('70 años'),
      productos_dermatologicos_excluidos: found('Sí'),
    },
    preexistencias_continuidad: {
      preexistencias_excluidas: found('Sí'),
      portabilidad_antiguedad: found('No'),
    },
    proceso_siniestros: {
      plazo_aviso_siniestro_dias: found('5'),
      tipo_dias_aviso: found('naturales'),
    },
    mecanismos_disputa: {
      clausula_renovacion: found('Renovación anual'),
      agravacion_riesgo: found('Sí'),
      proceso_cancelacion: found('30 días de anticipación'),
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
  it('groups the extraction the way the report prints it', () => {
    const groups = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(groups.map((group) => group.key)).toEqual([
      'identification',
      'financial',
      'coverage',
      'exclusions',
      'preexisting',
      'claims',
      'disputes',
    ])
  })

  it('states the contract and the money the policy actually says', () => {
    const [identification, financial] = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(identification?.rows.slice(0, 2).map((row) => [row.key, row.value])).toEqual([
      ['aseguradora', 'GNP'],
      ['nombre_plan', '—'],
    ])
    // The CNSF registration is what lets the filed contract be pulled and the
    // rest of this table checked against it, so it is printed, not dropped.
    expect(identification?.rows.find((row) => row.key === 'registro_cnsf')?.value).toBe(
      'CNSF-S0025-0123-2019',
    )
    // The derived rows close the group, after everything read from the policy.
    expect(identification?.rows.slice(-3).map((row) => [row.key, row.value])).toEqual([
      ['periodo', '30/05/2025 - 30/05/2026'],
      ['confianza', '96%'],
      ['fechaExtraccion', '2026-05-22'],
    ])

    expect(financial?.rows.slice(0, 5).map((row) => [row.key, row.value])).toEqual([
      ['suma_asegurada', '$2,120,000.00'],
      ['deducible', '$19,500.00'],
      ['tipo_deducible', 'Única por padecimiento'],
      ['coaseguro_porcentaje', '10%'],
      ['tope_coaseguro', '$68,000.00'],
    ])
    // The internal cap is a field of its own, not prose inside the tabulador.
    expect(financial?.rows.find((row) => row.key === 'tope_honorarios_medicos')?.value).toBe(
      '$210,000.00',
    )
  })

  it('keeps the quote on an extracted row and withholds one from a derived row', () => {
    const [identification] = buildPolicyExtraction(makeAnalysis(), makeMeta())

    expect(identification?.rows[0]?.campo?.evidencia).toBe('…GNP…')
    // The policy period, the extraction score and the run date are computed
    // here, not read from the policy — a citation on them would be fabricated.
    for (const row of identification?.rows.slice(-3) ?? []) {
      expect(row.campo).toBeNull()
    }
  })

  it('prints a field the agent could not find rather than dropping the row', () => {
    const [, , coverage] = buildPolicyExtraction(makeAnalysis(), makeMeta())

    // A silent policy and a section the tool never looked at have to look
    // different: the coordinator acts on the first and files a bug on the
    // second.
    expect(coverage?.rows.map((row) => row.key)).toEqual([
      'hospitalizacion_cubierta',
      'ambulatorio_cubierto',
      'medicamentos_cubiertos',
      'maternidad_cubierta',
      'emergencias_cubiertas',
      'dental_vision_cubierto',
      'biologicos_cubiertos',
      'medicamentos_especialidad_cubiertos',
      'pago_directo_disponible',
      'pago_directo_medicamentos',
      'coaseguro_medicamentos_ambulatorio',
      'modelo_red',
      'red_hospitalaria',
      'nivel_hospitalario',
      'zona_cobertura',
      'cobertura_eua',
      'terminos_cobertura_extranjero',
    ])
    expect(coverage?.rows.find((row) => row.key === 'biologicos_cubiertos')?.value).toBe('—')
    expect(coverage?.rows.find((row) => row.key === 'pago_directo_disponible')?.value).toBe('—')
    // "Internacional" is routinely written meaning "except the US". Silence on
    // it is a dash, never an inferred "No".
    expect(coverage?.rows.find((row) => row.key === 'cobertura_eua')?.value).toBe('No')
  })

  it('renders a run stored under the previous schema, with empty groups', () => {
    // Sections the v1/v2 runs carried under other names are stripped on parse,
    // so every group arrives empty rather than half-populated.
    const legacy = analisisSchema.parse({
      datos_poliza: { aseguradora: found('AXA') },
      coberturas: { deducible: found('$19,500.00') },
    })
    const groups = buildPolicyExtraction(legacy, makeMeta())

    expect(groups.find((group) => group.key === 'coverage')?.rows).toEqual([])
    expect(groups.find((group) => group.key === 'financial')?.rows).toEqual([])
    // Only the three derived rows survive, and the score says nothing rather
    // than claiming a confident zero.
    expect(
      groups.find((group) => group.key === 'identification')?.rows.map((row) => row.value),
    ).toEqual(['—', '—', '2026-05-22'])
  })
})

describe('extractionScore', () => {
  it('weighs each field by its own confidence', () => {
    const analysis = analisisSchema.parse({
      identificacion: { aseguradora: found('GNP'), tipo_poliza: { valor: 'x', confianza: 'media' } },
    })
    // 1 + 0.6 over two fields.
    expect(extractionScore(analysis)).toBe(80)
  })

  it('counts a field the agent looked for and did not find', () => {
    const analysis = analisisSchema.parse({
      identificacion: {
        aseguradora: found('GNP'),
        tipo_poliza: { valor: null, confianza: 'no_encontrado' },
      },
    })
    expect(extractionScore(analysis)).toBe(50)
  })

  it('says nothing rather than 0% when there are no fields at all', () => {
    expect(extractionScore(analisisSchema.parse({}))).toBeNull()
  })
})

describe('policyPeriod', () => {
  it('joins the two vigencia dates exactly as the policy wrote them', () => {
    expect(policyPeriod(makeAnalysis())).toBe('30/05/2025 - 30/05/2026')
  })

  it('prints the one date it has rather than an open range', () => {
    const analysis = makeAnalysis({ identificacion: { vigencia_inicio: found('30/05/2025') } })
    expect(policyPeriod(analysis)).toBe('30/05/2025')
  })

  it('falls back to a dash when neither date was found', () => {
    expect(policyPeriod(analisisSchema.parse({}))).toBe('—')
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
