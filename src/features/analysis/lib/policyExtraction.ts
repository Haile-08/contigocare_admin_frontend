import type { TranslationKey } from '@/shared/i18n'

import type { Analisis, AnalysisResult, Campo } from '../model/types'
import {
  COBERTURA_FIELD_ORDER,
  DISPUTA_FIELD_ORDER,
  EXCLUSIONES_FIELD_ORDER,
  FINANCIERA_FIELD_ORDER,
  IDENTIFICACION_FIELD_ORDER,
  PREEXISTENCIA_FIELD_ORDER,
  SINIESTROS_FIELD_ORDER,
} from '../model/types'
import { PLACEHOLDER } from './runSummary'

/**
 * Section 2 of the coverage report: the policy extraction.
 *
 * This is the factual backbone. Everything else the report says — the alerts,
 * the action plan, the money — is interpretation of these terms, so they are
 * built first, in one place, and the screen and the exported PDF read from the
 * same rows. A deductible that renders one way in the console and another way
 * in the broker's copy is worse than no export at all.
 *
 * The seven groups are the categories a broker reads a policy in, in the order
 * the report prints them: who the contract is with, what it costs, what it
 * covers, what it refuses, how tenure is treated, how a claim is filed, and
 * what happens when the answer is no.
 *
 * Everything here is pure. The download lives in the component.
 */

/** A row that came from an extracted field keeps its `Campo`, so the screen can
 *  show the confidence marker and the quote behind it. A row the console
 *  derived (the policy period, the extraction date) has none — and says so by
 *  being `null` rather than by carrying a `Campo` with invented evidence. */
export interface ExtractionRow {
  key: string
  label: TranslationKey
  value: string
  campo: Campo | null
  /** The agent's own value, present only once a reviewer has replaced it. See
   *  `extractionEdits`: a corrected row never loses what was extracted, because
   *  that is the thing the evidence quote and the confidence marker describe. */
  original?: string
}

export interface ExtractionGroup {
  key: string
  title: TranslationKey
  rows: ExtractionRow[]
}

const IDENTIFICACION_LABEL: Record<string, TranslationKey> = {
  aseguradora: 'extraction.aseguradora',
  nombre_plan: 'extraction.nombre_plan',
  nivel_plan: 'extraction.nivel_plan',
  numero_poliza: 'extraction.numero_poliza',
  tipo_poliza: 'extraction.tipo_poliza',
  contratante: 'extraction.contratante',
  asegurado_titular: 'extraction.asegurado_titular',
  numero_dependientes: 'extraction.numero_dependientes',
  vigencia_inicio: 'extraction.vigencia_inicio',
  vigencia_fin: 'extraction.vigencia_fin',
  fecha_renovacion: 'extraction.fecha_renovacion',
  moneda: 'extraction.moneda',
  codigo_agente: 'extraction.codigo_agente',
  registro_cnsf: 'extraction.registro_cnsf',
}

const FINANCIERA_LABEL: Record<string, TranslationKey> = {
  suma_asegurada: 'extraction.suma_asegurada',
  deducible: 'extraction.deducible',
  tipo_deducible: 'extraction.tipo_deducible',
  coaseguro_porcentaje: 'extraction.coaseguro_porcentaje',
  tope_coaseguro: 'extraction.tope_coaseguro',
  copagos: 'extraction.copagos',
  prima_total: 'extraction.prima_total',
  prima_neta: 'extraction.prima_neta',
  recargos_derechos: 'extraction.recargos_derechos',
  forma_pago: 'extraction.forma_pago',
  tabulador_aplicable: 'extraction.tabulador_aplicable',
  tope_honorarios_medicos: 'extraction.tope_honorarios_medicos',
  tope_medicamentos: 'extraction.tope_medicamentos',
  tope_enfermeria: 'extraction.tope_enfermeria',
  tope_por_padecimiento: 'extraction.tope_por_padecimiento',
}

const COBERTURA_LABEL: Record<string, TranslationKey> = {
  hospitalizacion_cubierta: 'extraction.hospitalizacion_cubierta',
  ambulatorio_cubierto: 'extraction.ambulatorio_cubierto',
  medicamentos_cubiertos: 'extraction.medicamentos_cubiertos',
  maternidad_cubierta: 'extraction.maternidad_cubierta',
  emergencias_cubiertas: 'extraction.emergencias_cubiertas',
  dental_vision_cubierto: 'extraction.dental_vision_cubierto',
  biologicos_cubiertos: 'extraction.biologicos_cubiertos',
  medicamentos_especialidad_cubiertos: 'extraction.medicamentos_especialidad_cubiertos',
  pago_directo_disponible: 'extraction.pago_directo_disponible',
  pago_directo_medicamentos: 'extraction.pago_directo_medicamentos',
  coaseguro_medicamentos_ambulatorio: 'extraction.coaseguro_medicamentos_ambulatorio',
  modelo_red: 'extraction.modelo_red',
  red_hospitalaria: 'extraction.red_hospitalaria',
  nivel_hospitalario: 'extraction.nivel_hospitalario',
  zona_cobertura: 'extraction.zona_cobertura',
  cobertura_eua: 'extraction.cobertura_eua',
  terminos_cobertura_extranjero: 'extraction.terminos_cobertura_extranjero',
}

const EXCLUSIONES_LABEL: Record<string, TranslationKey> = {
  edad_maxima_admision: 'extraction.edad_maxima_admision',
  edad_maxima_permanencia: 'extraction.edad_maxima_permanencia',
  congenitos_excluidos: 'extraction.congenitos_excluidos',
  productos_dermatologicos_excluidos: 'extraction.productos_dermatologicos_excluidos',
  biologicos_excluidos: 'extraction.biologicos_excluidos',
  cosmeticos_excluidos: 'extraction.cosmeticos_excluidos',
  exclusiones_especificas_asegurado: 'extraction.exclusiones_especificas_asegurado',
}

const PREEXISTENCIA_LABEL: Record<string, TranslationKey> = {
  preexistencias_excluidas: 'extraction.preexistencias_excluidas',
  via_cobertura: 'extraction.via_cobertura',
  cobertura_despues_de_meses: 'extraction.cobertura_despues_de_meses',
  rider_opcional_disponible: 'extraction.rider_opcional_disponible',
  regla_30_dias: 'extraction.regla_30_dias',
  antiguedad: 'extraction.antiguedad',
  portabilidad_antiguedad: 'extraction.portabilidad_antiguedad',
}

const SINIESTROS_LABEL: Record<string, TranslationKey> = {
  plazo_aviso_siniestro_dias: 'extraction.plazo_aviso_siniestro_dias',
  tipo_dias_aviso: 'extraction.tipo_dias_aviso',
  metodo_notificacion: 'extraction.metodo_notificacion',
  formatos_requeridos: 'extraction.formatos_requeridos',
  plazo_liquidacion_dias: 'extraction.plazo_liquidacion_dias',
  via_reembolso: 'extraction.via_reembolso',
  via_programacion: 'extraction.via_programacion',
  preautorizacion_alto_costo: 'extraction.preautorizacion_alto_costo',
}

const DISPUTA_LABEL: Record<string, TranslationKey> = {
  une_disponible: 'extraction.une_disponible',
  une_suspende_prescripcion: 'extraction.une_suspende_prescripcion',
  condusef_disponible: 'extraction.condusef_disponible',
  clausula_arbitraje: 'extraction.clausula_arbitraje',
  plazo_prescripcion: 'extraction.plazo_prescripcion',
  suspension_prescripcion: 'extraction.suspension_prescripcion',
  clausula_renovacion: 'extraction.clausula_renovacion',
  garantia_renovacion_vitalicia: 'extraction.garantia_renovacion_vitalicia',
  agravacion_riesgo: 'extraction.agravacion_riesgo',
  proceso_cancelacion: 'extraction.proceso_cancelacion',
}

/** The sections of the analysis that the extraction score is computed over. */
const SCORED_SECTIONS = [
  'identificacion',
  'estructura_financiera',
  'alcance_cobertura',
  'exclusiones_limitaciones',
  'preexistencias_continuidad',
  'proceso_siniestros',
  'mecanismos_disputa',
] as const

/** What one field's confidence is worth. `no_encontrado` is a zero and not an
 *  omission: a field the agent looked for and did not find is evidence about
 *  the extraction, not a gap in the denominator. */
const CONFIDENCE_WEIGHT: Record<string, number> = {
  alta: 1,
  media: 0.6,
  baja: 0.25,
  no_encontrado: 0,
}

function fieldOf(section: Record<string, Campo> | undefined, key: string): Campo | null {
  return section?.[key] ?? null
}

function valueOf(campo: Campo | null): string {
  const value = campo?.valor?.trim()
  return value ? value : PLACEHOLDER
}

function row(
  key: string,
  label: TranslationKey,
  section: Record<string, Campo> | undefined,
): ExtractionRow {
  const campo = fieldOf(section, key)
  return { key, label, value: valueOf(campo), campo }
}

/**
 * Every row of a section, or none of it.
 *
 * The agent answers each of these fields on every run, so a section that
 * arrives empty is not a policy that said nothing — it is a run stored before
 * the field existed. Printing seven dashes for it would state, on a document
 * that gets forwarded, that the contract is silent about direct payment when
 * nobody ever asked. An absent group says less, and less is true.
 */
function rowsFor(
  section: Record<string, Campo> | undefined,
  order: readonly string[],
  labels: Record<string, TranslationKey>,
): ExtractionRow[] {
  if (!section || Object.keys(section).length === 0) return []

  return order.flatMap<ExtractionRow>((key) => {
    const label = labels[key]
    return label ? [row(key, label, section)] : []
  })
}

/**
 * How much of the policy the agent actually read, as a percentage.
 *
 * A single global `alta`/`media` label flattens two very different runs: one
 * where every field was found and quoted, and one where four were found
 * confidently and thirty were not found at all. This weights each field by its
 * own confidence and divides by the number of fields the schema asked for, so
 * a mostly-empty extraction cannot present itself as a confident one.
 *
 * It is a coverage figure, not a probability — it says how much was read, not
 * how likely it is to be right. That is why the agent's own `confianza_global`
 * stays on screen next to it rather than being replaced by this number.
 */
export function extractionScore(analysis: Analisis): number | null {
  let total = 0
  let count = 0

  for (const name of SCORED_SECTIONS) {
    const section = analysis[name]
    for (const campo of Object.values(section)) {
      count += 1
      total += CONFIDENCE_WEIGHT[campo.confianza] ?? 0
    }
  }

  // An analysis with no fields at all is not a 0% extraction, it is an
  // unanswerable question — say nothing rather than print a damning zero.
  if (count === 0) return null

  return Math.round((total / count) * 100)
}

/**
 * `30/05/2025 - 30/05/2026`, or one date when only one was found.
 *
 * The dates are printed exactly as the policy wrote them. Reformatting them
 * would mean parsing a Mexican `dd/mm/yyyy` that an OCR pass may have mangled,
 * and a silently mis-parsed vigencia date is how a claim gets filed one day
 * after the policy lapsed.
 */
export function policyPeriod(analysis: Analisis): string {
  const start = analysis.identificacion['vigencia_inicio']?.valor?.trim()
  const end = analysis.identificacion['vigencia_fin']?.valor?.trim()

  if (start && end) return `${start} - ${end}`
  return start || end || PLACEHOLDER
}

/** The date the run happened, `2026-05-22`, in the reader's own timezone. */
export function extractionDate(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return PLACEHOLDER

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * The extraction, grouped as the report prints it.
 *
 * Rows are emitted even when the field was not found: an empty row is the
 * report saying "the policy is silent on direct payment for drugs", which is a
 * finding a coordinator has to act on. Dropping it would leave the reader
 * unable to tell a silent policy from a section the tool forgot to look at.
 */
export function buildPolicyExtraction(
  analysis: Analisis,
  meta: AnalysisResult,
): ExtractionGroup[] {
  const score = extractionScore(analysis)

  return [
    {
      key: 'identification',
      title: 'extraction.groupIdentification',
      rows: [
        ...rowsFor(analysis.identificacion, IDENTIFICACION_FIELD_ORDER, IDENTIFICACION_LABEL),
        // Derived, so they carry no `Campo`: these describe the run, not the
        // contract, and there is nothing in the policy to quote for them.
        {
          key: 'periodo',
          label: 'extraction.periodo',
          value: policyPeriod(analysis),
          campo: null,
        },
        {
          key: 'confianza',
          label: 'extraction.confidence',
          value: score === null ? PLACEHOLDER : `${score}%`,
          campo: null,
        },
        {
          key: 'fechaExtraccion',
          label: 'extraction.extractedAt',
          value: extractionDate(meta.created_at),
          campo: null,
        },
      ],
    },
    {
      key: 'financial',
      title: 'extraction.groupFinancial',
      rows: rowsFor(analysis.estructura_financiera, FINANCIERA_FIELD_ORDER, FINANCIERA_LABEL),
    },
    {
      key: 'coverage',
      title: 'extraction.groupCoverage',
      rows: rowsFor(analysis.alcance_cobertura, COBERTURA_FIELD_ORDER, COBERTURA_LABEL),
    },
    {
      key: 'exclusions',
      title: 'extraction.groupExclusions',
      rows: rowsFor(analysis.exclusiones_limitaciones, EXCLUSIONES_FIELD_ORDER, EXCLUSIONES_LABEL),
    },
    {
      key: 'preexisting',
      title: 'extraction.groupPreexisting',
      rows: rowsFor(
        analysis.preexistencias_continuidad,
        PREEXISTENCIA_FIELD_ORDER,
        PREEXISTENCIA_LABEL,
      ),
    },
    {
      key: 'claims',
      title: 'extraction.groupClaims',
      rows: rowsFor(analysis.proceso_siniestros, SINIESTROS_FIELD_ORDER, SINIESTROS_LABEL),
    },
    {
      key: 'disputes',
      title: 'extraction.groupDisputes',
      rows: rowsFor(analysis.mecanismos_disputa, DISPUTA_FIELD_ORDER, DISPUTA_LABEL),
    },
  ]
}
