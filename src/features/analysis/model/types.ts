import { z } from 'zod'

/**
 * The analysis wire contract.
 *
 * The Spanish field names are kept exactly as the backend sends them. Renaming
 * `coaseguro` to `coinsurance` on the way in would be a translation of a
 * contractual term performed by the transport layer, which is the last place
 * that decision should live — and it would make the UI's field paths disagree
 * with the ones stored in feedback corrections and in the golden set.
 */

export const confianzaSchema = z.enum(['alta', 'media', 'baja', 'no_encontrado'])
export const severidadSchema = z.enum(['critica', 'alta', 'media', 'informativa'])

export type Confianza = z.infer<typeof confianzaSchema>
export type Severidad = z.infer<typeof severidadSchema>

export const campoSchema = z.object({
  valor: z.string().nullish(),
  confianza: confianzaSchema.default('no_encontrado'),
  evidencia: z.string().nullish(),
  pagina: z.number().nullish(),
})

export type Campo = z.infer<typeof campoSchema>

export const beneficioSchema = z.object({
  nombre: z.string(),
  incluido: z.boolean().nullish(),
  suma_asegurada: z.string().nullish(),
  condiciones: z.string().nullish(),
  evidencia: z.string().nullish(),
  confianza: confianzaSchema.default('media'),
})

export const sublimiteSchema = z.object({
  concepto: z.string(),
  limite: z.string(),
  base: z.string().nullish(),
  evidencia: z.string().nullish(),
  confianza: confianzaSchema.default('media'),
})

export const periodoEsperaSchema = z.object({
  concepto: z.string(),
  periodo: z.string(),
  evidencia: z.string().nullish(),
})

export const exclusionSchema = z.object({
  descripcion: z.string(),
  categoria: z.string().nullish(),
  evidencia: z.string().nullish(),
})

export const hallazgoSchema = z.object({
  severidad: severidadSchema,
  categoria: z.string(),
  descripcion_es: z.string(),
  description_en: z.string(),
  evidencia: z.string().nullish(),
})

export const analisisSchema = z.object({
  // The seven sections the extraction report is built from. Every one is
  // defaulted rather than required: a run stored under the v1 or v2 schema has
  // none of them under these names, and it still has to open. `rowsFor` renders
  // an empty section as an absent group rather than as a column of dashes, so
  // an old run reads as "not asked" instead of "the policy is silent".
  identificacion: z.record(z.string(), campoSchema).default({}),
  estructura_financiera: z.record(z.string(), campoSchema).default({}),
  alcance_cobertura: z.record(z.string(), campoSchema).default({}),
  exclusiones_limitaciones: z.record(z.string(), campoSchema).default({}),
  preexistencias_continuidad: z.record(z.string(), campoSchema).default({}),
  proceso_siniestros: z.record(z.string(), campoSchema).default({}),
  mecanismos_disputa: z.record(z.string(), campoSchema).default({}),
  sublimites: z.array(sublimiteSchema).default([]),
  beneficios: z.array(beneficioSchema).default([]),
  periodos_espera: z.array(periodoEsperaSchema).default([]),
  exclusiones: z.array(exclusionSchema).default([]),
  preexistencias: z.string().nullish(),
  clausulas_especiales: z.array(z.string()).default([]),
  hallazgos: z.array(hallazgoSchema).default([]),
  resumen_es: z.string().default(''),
  summary_en: z.string().default(''),
  campos_no_encontrados: z.array(z.string()).default([]),
  confianza_global: confianzaSchema.default('media'),
  notas_calidad_documento: z.string().nullish(),
})

export type Analisis = z.infer<typeof analisisSchema>
export type Hallazgo = z.infer<typeof hallazgoSchema>
export type Beneficio = z.infer<typeof beneficioSchema>

/** One proposed or approved redaction. */
export const spanSchema = z.object({
  id: z.number(),
  start: z.number(),
  end: z.number(),
  category: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  text: z.string(),
  context_before: z.string().default(''),
  context_after: z.string().default(''),
  selected_by_default: z.boolean(),
  blocking: z.boolean(),
})

export type RedactionSpan = z.infer<typeof spanSchema>

export const extractResponseSchema = z.object({
  document_sha256: z.string(),
  document_kind: z.string(),
  page_count: z.number(),
  ocr_page_count: z.number(),
  truncated: z.boolean(),
  text: z.string(),
  spans: z.array(spanSchema),
  previously_analyzed: z.boolean().default(false),
})

export type ExtractedDocument = z.infer<typeof extractResponseSchema>

export const analyzeResponseSchema = z.object({
  analysis_id: z.string(),
  patient_id: z.string(),
  status: z.string(),
  /** ISO 8601. The run header's identifier and generation date come from this. */
  created_at: z.string().default(''),
  result: analisisSchema.nullish(),
  redaction_summary: z.record(z.string(), z.number()).default({}),
  model_name: z.string().default(''),
  prompt_version: z.string().default(''),
  latency_ms: z.number().default(0),
  input_tokens: z.number().default(0),
  output_tokens: z.number().default(0),
  self_critique_applied: z.boolean().default(false),
})

export type AnalysisResult = z.infer<typeof analyzeResponseSchema>

/** A verdict already on record, returned so the reviewer can revise it. */
export const storedFeedbackSchema = z.object({
  verdict: z.enum(['correct', 'partially_correct', 'incorrect']),
  field_corrections: z
    .record(z.string(), z.object({ was: z.string().nullish(), should_be: z.string().nullish() }))
    .default({}),
  notes: z.string().default(''),
  created_at: z.string(),
})

export type StoredFeedback = z.infer<typeof storedFeedbackSchema>

/**
 * A stored analysis, plus the redacted policy it was produced from.
 *
 * `redacted_text` is the only form of the policy that outlives the request that
 * created it — the upload itself is parsed in memory and dropped — so this is
 * what "view the patient's policy" actually shows.
 */
export const analysisDetailSchema = analyzeResponseSchema.extend({
  created_at: z.string(),
  page_count: z.number().default(0),
  redacted_char_count: z.number().default(0),
  redacted_text: z.string().default(''),
  feedback: storedFeedbackSchema.nullish(),
  /**
   * How many runs are filed under this patient, this one included. The delete
   * control names the real number instead of promising "everything", which is
   * the difference between an operator confirming an erasure and guessing at
   * one. Defaults to 1 so a server that has not learned the field yet still
   * offers a coherent — if conservative — sentence.
   */
  patient_analysis_count: z.number().default(1),
})

export type AnalysisDetail = z.infer<typeof analysisDetailSchema>

/** What an erasure removed. Counts, because the records are gone by the time
 *  anyone could check. */
export const deletionResponseSchema = z.object({
  patient_id: z.string(),
  deleted_analyses: z.number().default(0),
  deleted_feedback: z.number().default(0),
})

export type DeletionReceipt = z.infer<typeof deletionResponseSchema>

/** `run` erases this analysis; `patient` erases every analysis of the same
 *  patient, this one included. */
export type DeleteScope = 'run' | 'patient'

export interface DeleteAnalysisRequest {
  analysisId: string
  scope: DeleteScope
}

/** One row of the policy list. Metadata only — no policy text, no figures. */
export const analysisRowSchema = z.object({
  id: z.string(),
  patient_id: z.string(),
  created_at: z.string(),
  status: z.string(),
  aseguradora: z.string().nullish(),
  confianza_global: z.string().nullish(),
  verdict: z.string().nullish(),
  latency_ms: z.number().default(0),
  hallazgos_criticos: z.number().default(0),
})

export type AnalysisRow = z.infer<typeof analysisRowSchema>

export const analysisListSchema = z.object({
  items: z.array(analysisRowSchema).default([]),
  total: z.number().default(0),
  limit: z.number().default(25),
  offset: z.number().default(0),
})

export type AnalysisList = z.infer<typeof analysisListSchema>

export interface AnalysisListQuery {
  limit?: number
  offset?: number
  patientId?: string
}

export interface AnalyzeRequest {
  patientId: string
  document: ExtractedDocument
  approvedSpans: RedactionSpan[]
}

export type FeedbackVerdict = 'correct' | 'partially_correct' | 'incorrect'

export interface FieldCorrection {
  was: string | null
  should_be: string | null
}

export interface FeedbackRequest {
  analysisId: string
  verdict: FeedbackVerdict
  fieldCorrections: Record<string, FieldCorrection>
  notes: string
}

/** Display order for each `Campo` section, so the UI is not at the mercy of
 *  JSON key order. Anything the backend adds later still renders — it just
 *  renders after these. */
export const IDENTIFICACION_FIELD_ORDER = [
  'aseguradora',
  'nombre_plan',
  'nivel_plan',
  'numero_poliza',
  'tipo_poliza',
  'contratante',
  'asegurado_titular',
  'numero_dependientes',
  'vigencia_inicio',
  'vigencia_fin',
  'fecha_renovacion',
  'moneda',
  'codigo_agente',
  'registro_cnsf',
] as const

export const FINANCIERA_FIELD_ORDER = [
  'suma_asegurada',
  'deducible',
  'tipo_deducible',
  'coaseguro_porcentaje',
  'tope_coaseguro',
  'copagos',
  'prima_total',
  'prima_neta',
  'recargos_derechos',
  'forma_pago',
  'tabulador_aplicable',
  'tope_honorarios_medicos',
  'tope_medicamentos',
  'tope_enfermeria',
  'tope_por_padecimiento',
] as const

export const COBERTURA_FIELD_ORDER = [
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
] as const

export const EXCLUSIONES_FIELD_ORDER = [
  'edad_maxima_admision',
  'edad_maxima_permanencia',
  'congenitos_excluidos',
  'productos_dermatologicos_excluidos',
  'biologicos_excluidos',
  'cosmeticos_excluidos',
  'exclusiones_especificas_asegurado',
] as const

export const PREEXISTENCIA_FIELD_ORDER = [
  'preexistencias_excluidas',
  'via_cobertura',
  'cobertura_despues_de_meses',
  'rider_opcional_disponible',
  'regla_30_dias',
  'antiguedad',
  'portabilidad_antiguedad',
] as const

export const SINIESTROS_FIELD_ORDER = [
  'plazo_aviso_siniestro_dias',
  'tipo_dias_aviso',
  'metodo_notificacion',
  'formatos_requeridos',
  'plazo_liquidacion_dias',
  'via_reembolso',
  'via_programacion',
  'preautorizacion_alto_costo',
] as const

export const DISPUTA_FIELD_ORDER = [
  'une_disponible',
  'une_suspende_prescripcion',
  'condusef_disponible',
  'clausula_arbitraje',
  'plazo_prescripcion',
  'suspension_prescripcion',
  'clausula_renovacion',
  'garantia_renovacion_vitalicia',
  'agravacion_riesgo',
  'proceso_cancelacion',
] as const

/**
 * Every `Campo` section, with the order its fields are read in.
 *
 * The reviewer can correct any field in here, and the backend's eval harness
 * scores exactly the same set — a field correctable on screen but unscored, or
 * scored but uncorrectable, is a field the improvement loop cannot learn from.
 * Adding a section to the schema means adding it here too.
 */
export const CAMPO_SECTIONS = [
  ['identificacion', IDENTIFICACION_FIELD_ORDER],
  ['estructura_financiera', FINANCIERA_FIELD_ORDER],
  ['alcance_cobertura', COBERTURA_FIELD_ORDER],
  ['exclusiones_limitaciones', EXCLUSIONES_FIELD_ORDER],
  ['preexistencias_continuidad', PREEXISTENCIA_FIELD_ORDER],
  ['proceso_siniestros', SINIESTROS_FIELD_ORDER],
  ['mecanismos_disputa', DISPUTA_FIELD_ORDER],
] as const satisfies ReadonlyArray<readonly [keyof Analisis, readonly string[]]>
