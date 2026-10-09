import { z } from 'zod'

import { navigationResponseSchema } from './navigation'

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

export type Confianza = z.infer<typeof confianzaSchema>

export const campoSchema = z.object({
  valor: z.string().nullish(),
  confianza: confianzaSchema.default('no_encontrado'),
  evidencia: z.string().nullish(),
  pagina: z.number().nullish(),
})

export type Campo = z.infer<typeof campoSchema>

/**
 * The analysis: the six values the navigation intake is prefilled from, and a
 * summary. The navigator's own parser reads everything else from the redacted
 * policy, so the analysis no longer extracts it.
 *
 * Unknown keys are dropped rather than refused: a run stored under the wider v2
 * schema still opens, showing the fields this console still reads.
 */
export const analisisSchema = z.object({
  // Defaulted rather than required: a run stored under the v1 schema has none of
  // them under these names, and it still has to open. `rowsFor` renders an empty
  // section as an absent group rather than as a column of dashes, so an old run
  // reads as "not asked" instead of "the policy is silent".
  identificacion: z.record(z.string(), campoSchema).default({}),
  estructura_financiera: z.record(z.string(), campoSchema).default({}),
  preexistencias_continuidad: z.record(z.string(), campoSchema).default({}),
  resumen_es: z.string().default(''),
  summary_en: z.string().default(''),
  confianza_global: confianzaSchema.default('media'),
  notas_calidad_documento: z.string().nullish(),
})

export type Analisis = z.infer<typeof analisisSchema>

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
  /** The most recent navigation built on this analysis, when there is one. */
  navigation: navigationResponseSchema.nullish(),
})

export type AnalysisDetail = z.infer<typeof analysisDetailSchema>

/** What an erasure removed. Counts, because the records are gone by the time
 *  anyone could check. */
export const deletionResponseSchema = z.object({
  patient_id: z.string(),
  deleted_analyses: z.number().default(0),
  deleted_feedback: z.number().default(0),
  /** Navigations built on the erased analyses — they held the clinical intake. */
  deleted_navigations: z.number().default(0),
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

/** The upload, plus what the operator already knows identifies the patient.
 *  InnovaDerm's `--names` / `--policy-number`: every occurrence is proposed for
 *  removal, labelled or not. Used for one scan and never stored. */
export interface ExtractRequest {
  file: File
  names: string
  policyNumbers: string
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
 *  JSON key order. */
export const IDENTIFICACION_FIELD_ORDER = ['aseguradora', 'vigencia_inicio'] as const

export const FINANCIERA_FIELD_ORDER = ['deducible', 'coaseguro_porcentaje', 'tope_coaseguro'] as const

export const PREEXISTENCIA_FIELD_ORDER = ['antiguedad'] as const

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
  ['preexistencias_continuidad', PREEXISTENCIA_FIELD_ORDER],
] as const satisfies ReadonlyArray<readonly [keyof Analisis, readonly string[]]>
