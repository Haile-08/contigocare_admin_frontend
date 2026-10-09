import { describe, expect, it } from 'vitest'

import { analisisSchema } from '../model/types'
import {
  DEFAULT_DIAGNOSIS,
  applyCorrections,
  carrierFromName,
  initialIntakeForm,
  monthsBetween,
  parseTenureMonths,
  parseMoney,
  parsePercent,
  parsePolicyDate,
  toIntakePayload,
  validateIntakeForm,
} from './navigationIntake'
import type { IntakeForm } from './navigationIntake'

const TODAY = '2026-09-14'

function analysisWith(fields: Record<string, Record<string, { valor: string; confianza?: string }>>) {
  const shaped = Object.fromEntries(
    Object.entries(fields).map(([section, values]) => [
      section,
      Object.fromEntries(
        Object.entries(values).map(([key, { valor, confianza }]) => [
          key,
          { valor, confianza: confianza ?? 'alta', evidencia: valor },
        ]),
      ),
    ]),
  )
  return analisisSchema.parse(shaped)
}

function completeForm(overrides: Partial<IntakeForm> = {}): IntakeForm {
  return {
    ...initialIntakeForm(analisisSchema.parse({}), TODAY),
    carrier: 'MetLife',
    policyYearStart: '2026-01-15',
    monthsInsured: '28',
    treatmentRx: 'nemolizumab',
    ...overrides,
  }
}

describe('parsing extracted values', () => {
  it('reads exactly one amount and refuses ambiguity', () => {
    expect(parseMoney('$15,000.00 M.N.')).toBe(15000)
    expect(parseMoney('10% hasta $25,300')).toBe(25300)
    expect(parseMoney('$15,000 ó $25,000 según plan')).toBeNull()
  })

  it('reads percentages and dates', () => {
    expect(parsePercent('10 %')).toBe(10)
    expect(parsePercent('10% o 20%')).toBeNull()
    expect(parsePolicyDate('30/05/2025')).toBe('2025-05-30')
    expect(parsePolicyDate('15 de enero de 2026')).toBe('2026-01-15')
    expect(parsePolicyDate('31/02/2026')).toBeNull()
    expect(parsePolicyDate('Desde las 12 hrs del 30 05 2025')).toBe('2025-05-30')
    expect(parsePolicyDate('30/MAY/2025')).toBe('2025-05-30')
    expect(parsePolicyDate('15-ene-2026')).toBe('2026-01-15')
  })

  it('maps insurer names onto the handover spellings', () => {
    expect(carrierFromName('MetLife México, S.A. de C.V.')).toBe('MetLife')
    expect(carrierFromName('Seguros Monterrey New York Life')).toBe('SMNYL')
    expect(carrierFromName('Grupo Nacional Provincial')).toBe('GNP')
    expect(carrierFromName('AXA Seguros')).toBe('AXA')
    expect(carrierFromName('Zurich')).toBe('')
  })

  it('reads tenure as a start date or a length', () => {
    expect(parseTenureMonths('Antigüedad desde 01/03/2019', TODAY)).toBe(90)
    expect(parseTenureMonths('5 años', TODAY)).toBe(60)
    expect(parseTenureMonths('2 años 3 meses', TODAY)).toBe(27)
    expect(parseTenureMonths('60 meses', TODAY)).toBe(60)
    expect(parseTenureMonths('Reconocida', TODAY)).toBeNull()
    expect(parseTenureMonths('01/01/2030', TODAY)).toBeNull()
  })

  it('counts whole months', () => {
    expect(monthsBetween('2024-05-30', TODAY)).toBe(27)
    expect(monthsBetween('2026-09-15', TODAY)).toBe(0)
  })
})

describe('initialIntakeForm', () => {
  it('prefills what the extraction stood behind, and nothing it did not', () => {
    const analysis = analysisWith({
      identificacion: {
        aseguradora: { valor: 'MetLife México, S.A. de C.V.' },
        vigencia_inicio: { valor: '30/05/2024' },
      },
      estructura_financiera: {
        deducible: { valor: '$19,500.00' },
        coaseguro_porcentaje: { valor: '10%' },
        tope_coaseguro: { valor: '$68,000.00', confianza: 'baja' },
      },
    })

    const form = initialIntakeForm(analysis, TODAY)

    expect(form.carrier).toBe('MetLife')
    expect(form.policyYearStart).toBe('2024-05-30')
    expect(form.monthsInsured).toBe('27')
    expect(form.deducible).toBe('19500')
    expect(form.coaseguro).toBe('10')
    expect(form.tope).toBe('')
    expect(form.incidenceDate).toBe(TODAY)
    expect(form.diagnosis).toBe(DEFAULT_DIAGNOSIS)
    expect(form.icd10).toBe('L20.9')
  })

  it('takes continuous coverage from antiguedad over the current vigencia', () => {
    const analysis = analysisWith({
      identificacion: { vigencia_inicio: { valor: '15/01/2026' } },
      preexistencias_continuidad: { antiguedad: { valor: 'Antigüedad reconocida desde el 01/03/2019' } },
    })

    const form = initialIntakeForm(analysis, TODAY)

    expect(form.policyYearStart).toBe('2026-01-15')
    expect(form.monthsInsured).toBe('90')
  })

  it('prefills a GNP carátula as the extraction quoted it', () => {
    const analysis = analysisWith({
      identificacion: {
        aseguradora: { valor: 'Grupo Nacional Provincial S.A.B.' },
        vigencia_inicio: { valor: '30 05 2025' },
      },
      estructura_financiera: {
        deducible: { valor: '19,500.00 pesos' },
        coaseguro_porcentaje: { valor: '10%' },
      },
      preexistencias_continuidad: { antiguedad: { valor: '30/05/2024' } },
    })

    const form = initialIntakeForm(analysis, TODAY)

    expect(form.carrier).toBe('GNP')
    expect(form.policyYearStart).toBe('2025-05-30')
    expect(form.monthsInsured).toBe('27')
    expect(form.deducible).toBe('19500')
    expect(form.coaseguro).toBe('10')
  })

  it('prefills from the reviewer’s corrections over the extraction', () => {
    const analysis = analysisWith({
      identificacion: { aseguradora: { valor: 'AXA Seguros' } },
      estructura_financiera: {
        deducible: { valor: '$19,500.00' },
        coaseguro_porcentaje: { valor: '10%' },
        tope_coaseguro: { valor: '$68,000.00', confianza: 'baja' },
      },
    })

    const corrected = applyCorrections(analysis, {
      'identificacion.aseguradora': { should_be: 'GNP' },
      'estructura_financiera.deducible': { should_be: '$25,000' },
      'estructura_financiera.coaseguro_porcentaje': { should_be: null },
      'estructura_financiera.tope_coaseguro': { should_be: '$68,000' },
      'unknown_section.field': { should_be: 'ignored' },
    })
    const form = initialIntakeForm(corrected, TODAY)

    expect(form.carrier).toBe('GNP')
    expect(form.deducible).toBe('25000')
    expect(form.coaseguro).toBe('')
    expect(form.tope).toBe('68000')
    expect(applyCorrections(analysis, {})).toBe(analysis)
  })

  it('restores a previous intake, without its redacted denial', () => {
    const form = initialIntakeForm(analisisSchema.parse({}), TODAY, {
      carrier: 'GNP',
      policy_year_start: '2025-08-01',
      months_insured: 10,
      treatment_rx: 'dupilumab',
      prior_treatments_failed: ['tacrolimus', 'ciclosporina'],
      denial_reason: 'Negada a [NOMBRE_1]',
      programacion_done: true,
      authorization: { expiry_date: '2026-12-01' },
    })

    expect(form.carrier).toBe('GNP')
    expect(form.monthsInsured).toBe('10')
    expect(form.priorTreatments).toBe('tacrolimus\nciclosporina')
    expect(form.programacionDone).toBe(true)
    expect(form.denialReason).toBe('')
    expect(form.authorizationExpiry).toBe('2026-12-01')
  })
})

describe('validation and payload', () => {
  it('requires the policy start, the incidence and a treatment', () => {
    const errors = validateIntakeForm(
      completeForm({ policyYearStart: '', incidenceDate: '', treatmentRx: '' }),
      TODAY,
    )
    expect(errors.policyYearStart).toBe('navigation.error.required')
    expect(errors.incidenceDate).toBe('navigation.error.required')
    expect(errors.treatmentRx).toBe('navigation.error.required')
  })

  it('rejects out-of-range scores, a future policy start and a non-numeric cédula', () => {
    const errors = validateIntakeForm(
      completeForm({ easi: '90', dlqi: '4.5', policyYearStart: '2027-01-01', dermatologistCedula: 'ABC' }),
      TODAY,
    )
    expect(errors.easi).toBe('navigation.error.range')
    expect(errors.dlqi).toBe('navigation.error.number')
    expect(errors.policyYearStart).toBe('navigation.error.future')
    expect(errors.dermatologistCedula).toBe('navigation.error.number')
  })

  it('builds the InnovaDerm intake', () => {
    const form = completeForm({
      deducible: '$15,000',
      coaseguro: '10',
      easi: '28',
      priorTreatments: 'tacrolimus\n\n ciclosporina ',
      denialReason: '  ',
      authorizationExpiry: '2026-12-01',
      dermatologistName: ' Roberto Sánchez Morales ',
      dermatologistCedula: '7654321',
    })
    expect(validateIntakeForm(form, TODAY)).toEqual({})

    const payload = toIntakePayload(form)
    expect(payload.carrier).toBe('MetLife')
    expect(payload.months_insured).toBe(28)
    expect(payload.deducible).toBe(15000)
    expect(payload.tope_coaseguro).toBeNull()
    expect(payload.easi_score).toBe(28)
    expect(payload.prior_treatments_failed).toEqual(['tacrolimus', 'ciclosporina'])
    expect(payload.denial_reason).toBeNull()
    expect(payload.dermatologist_name).toBe('Roberto Sánchez Morales')
    expect(payload.authorization).toEqual({ granted_date: null, expiry_date: '2026-12-01', doses_authorized: null })
  })

  it('sends another insurer as no carrier hint', () => {
    expect(toIntakePayload(completeForm({ carrier: '' })).carrier).toBeNull()
  })
})
