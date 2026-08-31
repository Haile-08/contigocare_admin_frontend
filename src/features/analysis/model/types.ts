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
  datos_poliza: z.record(z.string(), campoSchema),
  coberturas: z.record(z.string(), campoSchema),
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
})

export type AnalysisDetail = z.infer<typeof analysisDetailSchema>

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

/** Display order for the two `Campo` sections, so the UI is not at the mercy of
 *  JSON key order. Anything the backend adds later still renders — it just
 *  renders after these. */
export const POLIZA_FIELD_ORDER = [
  'aseguradora',
  'nombre_plan',
  'numero_poliza',
  'ramo',
  'contratante',
  'titular',
  'numero_dependientes',
  'vigencia_inicio',
  'vigencia_fin',
  'fecha_emision',
  'antiguedad',
  'moneda',
  'forma_pago',
  'prima_total',
] as const

export const COBERTURA_FIELD_ORDER = [
  'suma_asegurada',
  'suma_asegurada_por_padecimiento',
  'deducible',
  'coaseguro_porcentaje',
  'tope_coaseguro',
  'nivel_hospitalario',
  'tabulador_medico',
  'red_hospitalaria',
  'cobertura_geografica',
] as const
