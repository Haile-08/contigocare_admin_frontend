import type { TranslationKey } from '@/shared/i18n'

import { CARRIER_OPTIONS } from '../model/navigation'
import type { CarrierOption, NavigationIntake } from '../model/navigation'
import type { Analisis, Campo } from '../model/types'

/**
 * InnovaDerm's patient intake, as pure functions: prefill, validate, serialise.
 *
 * The fields are the handover's `samples/intake_template.json`, grouped as its
 * intake template groups them — the carátula, the clinical data, the incidence —
 * less what the console never holds: there is no field for the patient's name,
 * policy number or birth date. The patient id is the analysis's.
 *
 * Prefilling from the saved analysis is a convenience. Whatever is in a box when
 * the form is sent is what the coordinator confirmed, and it is what the
 * pipeline runs on.
 */

export interface IntakeForm {
  /** `AXA`, `GNP`, `MetLife`, `SMNYL`, or empty for another insurer. */
  carrier: string
  policyYearStart: string
  monthsInsured: string
  deducible: string
  coaseguro: string
  tope: string
  riderPreexisting: boolean
  programacionDone: boolean
  diagnosis: string
  icd10: string
  treatmentRx: string
  easi: string
  scorad: string
  dlqi: string
  /** One treatment per line. */
  priorTreatments: string
  preexisting: boolean
  dermatologistName: string
  dermatologistCedula: string
  cofepris: string
  incidenceDate: string
  notificationSent: boolean
  denialReason: string
  authorizationExpiry: string
}

export type IntakeErrors = Partial<Record<keyof IntakeForm, TranslationKey>>

export const DEFAULT_DIAGNOSIS = 'Dermatitis Atópica moderada-severa refractaria'
const DEFAULT_ICD10 = 'L20.9'

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

/** Carátulas abbreviate months as often as they spell them: `30/MAY/2025`, `15-ENE-2026`. */
const MONTH_ABBREVIATIONS: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  set: 9,
  oct: 10,
  nov: 11,
  dic: 12,
}

/** A field the extraction stood behind: found, and not downgraded for lack of evidence. */
function trusted(campo: Campo | undefined): string | null {
  if (!campo?.valor) return null
  if (campo.confianza === 'no_encontrado' || campo.confianza === 'baja') return null
  const value = campo.valor.trim()
  if (!value || /^\[[A-Z_]+_\d+\]$/.test(value)) return null
  return value
}

/** Exactly one currency amount, or null — `"$15,000 ó $25,000"` is a question, not a figure. */
export function parseMoney(text: string | null): number | null {
  if (!text) return null
  const withoutPercent = text.replace(/\d{1,3}(?:[.,]\d+)?\s*%/g, ' ')
  const matches = withoutPercent.match(/\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) ?? []
  if (matches.length !== 1) return null
  const value = Number(matches[0].replace(/[,\s]/g, ''))
  return Number.isFinite(value) ? value : null
}

/** Exactly one percentage, or null. */
export function parsePercent(text: string | null): number | null {
  if (!text) return null
  const matches = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/g) ?? []
  if (matches.length === 1) return Number(matches[0].replace('%', '').replace(',', '.').trim())
  if (matches.length === 0 && /^\s*\d{1,3}(?:[.,]\d+)?\s*$/.test(text)) {
    const value = Number(text.trim().replace(',', '.'))
    return value >= 0 && value <= 100 ? value : null
  }
  return null
}

function iso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * A policy date as `YYYY-MM-DD`: ISO, `dd/mm/aaaa`, `dd mm aaaa`, `30/MAY/2025`,
 * or `15 de enero de 2026`.
 *
 * The space-separated form is how GNP's car\u00e1tula prints its vigencia
 * ("Desde las 12 hrs del 30 05 2025"), and the extraction quotes it as printed.
 */
export function parsePolicyDate(text: string | null): string | null {
  if (!text) return null
  const folded = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const isoMatch = folded.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (isoMatch) return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))

  const numeric = folded.match(/\b(\d{1,2})(?:\s*[/.-]\s*|\s+)(\d{1,2})(?:\s*[/.-]\s*|\s+)(\d{4})\b/)
  if (numeric) return iso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]))

  const words = folded.match(/\b(\d{1,2})[\s/.-]+(?:de\s+)?([a-z]+)\.?[\s/.-]+(?:de\s+|del\s+)?(\d{4})\b/)
  const month = words?.[2] ? (MONTHS[words[2]] ?? MONTH_ABBREVIATIONS[words[2]]) : undefined
  if (words && month) return iso(Number(words[3]), month, Number(words[1]))

  return null
}

/** The insurer as the handover spells it, or empty for one it has no rules for. */
export function carrierFromName(name: string | null): string {
  if (!name) return ''
  const folded = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
  if (/\b(smnyl|monterrey new york life|seguros monterrey|monterrey nyl)\b/.test(folded)) return 'SMNYL'
  if (/\bmet ?life\b/.test(folded)) return 'MetLife'
  if (/\b(gnp|grupo nacional provincial)\b/.test(folded)) return 'GNP'
  if (/\baxa\b/.test(folded)) return 'AXA'
  return ''
}

/** Whole months from one ISO date to another, never negative. */
export function monthsBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) return 0
  let months = (endYear - startYear) * 12 + (endMonth - startMonth)
  if (endDay < startDay) months -= 1
  return Math.max(months, 0)
}

/**
 * Months of continuous coverage from the policy's `antiguedad`.
 *
 * A carátula states tenure either as the date it runs from ("Antigüedad desde
 * 01/03/2019") or as a length ("5 años", "60 meses", "2 años 3 meses"). Either is
 * better than counting from the current vigencia, which restarts at every
 * renewal and would make a patient insured since 2019 look eight months old —
 * the difference between MetLife covering a preexisting condition and refusing
 * it.
 */
export function parseTenureMonths(text: string | null, today: string): number | null {
  if (!text) return null

  const since = parsePolicyDate(text)
  if (since) return since <= today ? monthsBetween(since, today) : null

  const folded = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const years = folded.match(/(\d{1,3})\s*anos?\b/)
  const months = folded.match(/(\d{1,4})\s*mes(?:es)?\b/)
  if (!years && !months) return null
  return Number(years?.[1] ?? 0) * 12 + Number(months?.[1] ?? 0)
}

function asText(value: number | null): string {
  return value === null ? '' : String(value)
}

function readString(values: Record<string, unknown>, key: string): string {
  const value = values[key]
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''
}

function readBool(values: Record<string, unknown>, key: string): boolean {
  return values[key] === true
}

/**
 * The analysis as the reviewer left it: each field correction from the verdict
 * replaces the extracted value.
 *
 * A corrected value is one a person read off the carátula, so it is marked
 * `alta` and prefills even where the model's own reading was too unsure to.
 * A correction with no `should_be` records a value the model invented, and
 * clears the field instead. Paths are `section.field`, as feedback stores them.
 */
export function applyCorrections(
  analysis: Analisis,
  corrections: Record<string, { should_be?: string | null }> | null | undefined,
): Analisis {
  if (!corrections || Object.keys(corrections).length === 0) return analysis

  const sections = ['identificacion', 'estructura_financiera', 'preexistencias_continuidad'] as const
  const next: Analisis = { ...analysis }
  for (const [path, correction] of Object.entries(corrections)) {
    const [section, field, ...rest] = path.split('.')
    if (!field || rest.length > 0) continue
    const name = sections.find((candidate) => candidate === section)
    if (!name) continue

    const shouldBe = correction.should_be?.trim() ?? ''
    next[name] = {
      ...next[name],
      [field]: shouldBe
        ? { valor: shouldBe, confianza: 'alta', evidencia: null, pagina: null }
        : { valor: null, confianza: 'no_encontrado', evidencia: null, pagina: null },
    }
  }
  return next
}

/**
 * The form's starting state.
 *
 * A previous intake wins over the analysis: re-running a navigation — usually
 * because a denial arrived — should start from what the coordinator confirmed
 * last time. The denial is not restored, because what was stored is the redacted
 * form, and editing `[NOMBRE_1]` back into a denial reason helps nobody.
 */
export function initialIntakeForm(
  analysis: Analisis,
  today: string,
  previous?: Record<string, unknown> | null,
): IntakeForm {
  if (previous && Object.keys(previous).length > 0) {
    const treatments = previous['prior_treatments_failed']
    const authorization = previous['authorization']
    return {
      carrier: readString(previous, 'carrier'),
      policyYearStart: readString(previous, 'policy_year_start'),
      monthsInsured: readString(previous, 'months_insured'),
      deducible: readString(previous, 'deducible'),
      coaseguro: readString(previous, 'coaseguro_pct'),
      tope: readString(previous, 'tope_coaseguro'),
      riderPreexisting: readBool(previous, 'rider_preexisting'),
      programacionDone: readBool(previous, 'programacion_done'),
      diagnosis: readString(previous, 'diagnosis') || DEFAULT_DIAGNOSIS,
      icd10: readString(previous, 'diagnosis_icd10') || DEFAULT_ICD10,
      treatmentRx: readString(previous, 'treatment_rx'),
      easi: readString(previous, 'easi_score'),
      scorad: readString(previous, 'scorad_score'),
      dlqi: readString(previous, 'dlqi_score'),
      priorTreatments: Array.isArray(treatments)
        ? treatments.filter((entry): entry is string => typeof entry === 'string').join('\n')
        : '',
      preexisting: readBool(previous, 'preexisting'),
      dermatologistName: readString(previous, 'dermatologist_name'),
      dermatologistCedula: readString(previous, 'dermatologist_cedula'),
      cofepris: readString(previous, 'cofepris_registration'),
      incidenceDate: readString(previous, 'incidence_date') || today,
      notificationSent: readBool(previous, 'notification_sent'),
      denialReason: '',
      authorizationExpiry:
        authorization && typeof authorization === 'object'
          ? readString(authorization as Record<string, unknown>, 'expiry_date')
          : '',
    }
  }

  // Section A of the intake is the carátula, and the analysis already read it.
  const identification = analysis.identificacion
  const financial = analysis.estructura_financiera
  const start = parsePolicyDate(trusted(identification['vigencia_inicio']))
  const validStart = start && start <= today ? start : null
  const tenure =
    parseTenureMonths(trusted(analysis.preexistencias_continuidad['antiguedad']), today) ??
    (validStart ? monthsBetween(validStart, today) : null)

  return {
    carrier: carrierFromName(trusted(identification['aseguradora'])),
    policyYearStart: validStart ?? '',
    monthsInsured: asText(tenure),
    deducible: asText(parseMoney(trusted(financial['deducible']))),
    coaseguro: asText(parsePercent(trusted(financial['coaseguro_porcentaje']))),
    tope: asText(parseMoney(trusted(financial['tope_coaseguro']))),
    riderPreexisting: false,
    programacionDone: false,
    diagnosis: DEFAULT_DIAGNOSIS,
    icd10: DEFAULT_ICD10,
    treatmentRx: '',
    easi: '',
    scorad: '',
    dlqi: '',
    priorTreatments: '',
    preexisting: false,
    dermatologistName: '',
    dermatologistCedula: '',
    cofepris: '',
    incidenceDate: today,
    notificationSent: false,
    denialReason: '',
    authorizationExpiry: '',
  }
}

function numberOrNull(text: string): number | null {
  const trimmed = text.trim().replace(/[$,\s]/g, '')
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : Number.NaN
}

const RANGES: Partial<Record<keyof IntakeForm, [number, number]>> = {
  monthsInsured: [0, 1200],
  deducible: [0, 10_000_000],
  coaseguro: [0, 100],
  tope: [0, 50_000_000],
  easi: [0, 72],
  scorad: [0, 103],
  dlqi: [0, 30],
}

/** Field-level errors, keyed like the form. Empty when the form can be sent. */
export function validateIntakeForm(form: IntakeForm, today: string): IntakeErrors {
  const errors: IntakeErrors = {}

  if (form.carrier && !CARRIER_OPTIONS.includes(form.carrier as CarrierOption)) {
    errors.carrier = 'navigation.error.required'
  }
  if (!form.policyYearStart) errors.policyYearStart = 'navigation.error.required'
  else if (form.policyYearStart > today) errors.policyYearStart = 'navigation.error.future'
  if (!form.incidenceDate) errors.incidenceDate = 'navigation.error.required'
  if (form.treatmentRx.trim().length < 2) errors.treatmentRx = 'navigation.error.required'
  if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(form.icd10.trim())) errors.icd10 = 'navigation.error.icd10'
  if (form.diagnosis.trim().length < 3) errors.diagnosis = 'navigation.error.required'
  if (!/^\d{0,12}$/.test(form.dermatologistCedula.trim())) errors.dermatologistCedula = 'navigation.error.number'

  for (const [key, [min, max]] of Object.entries(RANGES) as [keyof IntakeForm, [number, number]][]) {
    const value = numberOrNull(String(form[key]))
    if (value === null) continue
    if (Number.isNaN(value)) errors[key] = 'navigation.error.number'
    else if (value < min || value > max) errors[key] = 'navigation.error.range'
  }

  for (const key of ['dlqi', 'monthsInsured'] as const) {
    if (form[key].trim() && !Number.isInteger(Number(form[key].trim()))) errors[key] = 'navigation.error.number'
  }

  const treatments = form.priorTreatments.split('\n').filter((line) => line.trim())
  if (treatments.length > 10 || treatments.some((line) => line.trim().length > 300)) {
    errors.priorTreatments = 'navigation.error.treatments'
  }
  if (form.denialReason.length > 4000) errors.denialReason = 'navigation.error.tooLong'
  if (form.dermatologistName.length > 120) errors.dermatologistName = 'navigation.error.tooLong'
  if (form.cofepris.length > 80) errors.cofepris = 'navigation.error.tooLong'

  return errors
}

function blankToNull(text: string): string | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : trimmed
}

/** The request body. Call only on a form `validateIntakeForm` accepted. */
export function toIntakePayload(form: IntakeForm): NavigationIntake {
  return {
    carrier: CARRIER_OPTIONS.includes(form.carrier as CarrierOption) ? (form.carrier as CarrierOption) : null,
    policy_year_start: form.policyYearStart,
    months_insured: numberOrNull(form.monthsInsured) ?? 0,
    deducible: numberOrNull(form.deducible),
    coaseguro_pct: numberOrNull(form.coaseguro),
    tope_coaseguro: numberOrNull(form.tope),
    rider_preexisting: form.riderPreexisting,
    diagnosis: form.diagnosis.trim(),
    diagnosis_icd10: form.icd10.trim(),
    treatment_rx: form.treatmentRx.trim(),
    easi_score: numberOrNull(form.easi),
    scorad_score: numberOrNull(form.scorad),
    dlqi_score: numberOrNull(form.dlqi),
    prior_treatments_failed: form.priorTreatments
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    preexisting: form.preexisting,
    dermatologist_name: form.dermatologistName.trim(),
    dermatologist_cedula: form.dermatologistCedula.trim(),
    cofepris_registration: form.cofepris.trim(),
    incidence_date: form.incidenceDate,
    notification_sent: form.notificationSent,
    programacion_done: form.programacionDone,
    denial_reason: blankToNull(form.denialReason),
    authorization: form.authorizationExpiry
      ? { granted_date: null, expiry_date: form.authorizationExpiry, doses_authorized: null }
      : null,
  }
}

/** Today in the operator's timezone, as `YYYY-MM-DD`. */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
