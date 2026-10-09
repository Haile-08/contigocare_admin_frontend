import { z } from 'zod'

import type { TranslationKey } from '@/shared/i18n'

/**
 * The navigation wire contract: InnovaDerm Navigator, run on a stored analysis.
 *
 * `result` is InnovaDerm's `summary_<run>.json`, stored as the pipeline produced
 * it. Part of its shape is the model's own — an appeal pathway arrives as
 * `step_1` on one run and `level_1` on the next — so it crosses the wire as a
 * plain object and `innovadermSummary` reads it defensively, the way the
 * coordinator report does.
 */

/** The report sections a reviewer can flag, named as the summary names them. */
export const NAVIGATION_SECTIONS = [
  'policy_extraction',
  'carrier_alerts',
  'deadlines',
  'action_plan',
  'docs_checklist',
  'cost_projection',
  'financial_roadmap',
  'adherence',
  'appeal_pathway',
  'notification_letter',
  'appeal_package',
] as const
export type NavigationSection = (typeof NAVIGATION_SECTIONS)[number]

export const NAVIGATION_SECTION_LABEL: Record<NavigationSection, TranslationKey> = {
  policy_extraction: 'navigationFeedback.section.policy_extraction',
  carrier_alerts: 'navigationFeedback.section.carrier_alerts',
  deadlines: 'navigationFeedback.section.deadlines',
  action_plan: 'navigationFeedback.section.action_plan',
  docs_checklist: 'navigationFeedback.section.docs_checklist',
  cost_projection: 'navigationFeedback.section.cost_projection',
  financial_roadmap: 'navigationFeedback.section.financial_roadmap',
  adherence: 'navigationFeedback.section.adherence',
  appeal_pathway: 'navigationFeedback.section.appeal_pathway',
  notification_letter: 'navigationFeedback.section.notification_letter',
  appeal_package: 'navigationFeedback.section.appeal_package',
}

export const sectionFeedbackSchema = z.object({
  flagged: z.boolean().default(false),
  comment: z.string().default(''),
})
export type SectionFeedback = z.infer<typeof sectionFeedbackSchema>

/** A verdict on a navigation already on record. */
export const navigationFeedbackSchema = z.object({
  verdict: z.enum(['correct', 'partially_correct', 'incorrect']),
  sections: z.record(z.string(), sectionFeedbackSchema).default({}),
  notes: z.string().default(''),
  created_at: z.string(),
})
export type NavigationFeedback = z.infer<typeof navigationFeedbackSchema>

export const navigationResponseSchema = z.object({
  navigation_id: z.string(),
  analysis_id: z.string(),
  patient_id: z.string(),
  /** `running`, `succeeded`, `failed` or `blocked_by_redaction`. */
  status: z.string(),
  /** While running, the agent at work. */
  current_agent: z.string().nullish(),
  created_at: z.string(),
  intake: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).nullish(),
  error: z.string().nullish(),
  prompt_version: z.string().default(''),
  model_names: z.record(z.string(), z.string()).default({}),
  input_tokens: z.number().default(0),
  output_tokens: z.number().default(0),
  latency_ms: z.number().default(0),
  degraded_agents: z.array(z.string()).default([]),
  /** The reviewer's verdict on the run, when one has been given. */
  feedback: navigationFeedbackSchema.nullish(),
})
export type NavigationRun = z.infer<typeof navigationResponseSchema>

export const drugCatalogSchema = z.object({
  items: z
    .array(
      z.object({
        clave: z.string(),
        nombre_generico: z.string(),
        marca: z.string(),
        fabricante: z.string(),
        indicacion: z.string(),
        via: z.string(),
        frecuencia_dias: z.number(),
        dosis_carga: z.number(),
        costo_mensual_mxn: z.number(),
        registro_cofepris: z.string().default(''),
        biologico: z.boolean().default(false),
      }),
    )
    .default([]),
})
export type DrugCatalog = z.infer<typeof drugCatalogSchema>
export type DrugCatalogItem = DrugCatalog['items'][number]

/** The pipeline's agents, in the order they run. */
export const AGENT_ORDER = ['parser', 'planner', 'notification', 'optimizer', 'adherence', 'advocate'] as const
export type AgentKey = (typeof AGENT_ORDER)[number]

export const AGENT_LABEL: Record<AgentKey, TranslationKey> = {
  parser: 'navigation.agent.parser',
  planner: 'navigation.agent.planner',
  notification: 'navigation.agent.notification',
  optimizer: 'navigation.agent.optimizer',
  adherence: 'navigation.agent.adherence',
  advocate: 'navigation.agent.advocate',
}

/** An agent's label, or its key for one this console does not know. */
export function agentLabelKey(agent: string): TranslationKey | null {
  return (AGENT_ORDER as readonly string[]).includes(agent) ? AGENT_LABEL[agent as AgentKey] : null
}

export const CARRIER_OPTIONS = ['AXA', 'GNP', 'MetLife', 'SMNYL'] as const
export type CarrierOption = (typeof CARRIER_OPTIONS)[number]

/**
 * What the intake form posts: InnovaDerm's patient intake. The backend rejects
 * any extra key — there is no field for a patient name, policy number or birth
 * date, so none is sent.
 */
export interface NavigationIntake {
  carrier: CarrierOption | null
  policy_year_start: string
  months_insured: number
  deducible: number | null
  coaseguro_pct: number | null
  tope_coaseguro: number | null
  rider_preexisting: boolean
  diagnosis: string
  diagnosis_icd10: string
  treatment_rx: string
  easi_score: number | null
  scorad_score: number | null
  dlqi_score: number | null
  prior_treatments_failed: string[]
  preexisting: boolean
  dermatologist_name: string
  dermatologist_cedula: string
  cofepris_registration: string
  incidence_date: string
  notification_sent: boolean
  programacion_done: boolean
  denial_reason: string | null
  authorization: { granted_date: string | null; expiry_date: string; doses_authorized: number | null } | null
}

export interface RunNavigationRequest {
  analysisId: string
  intake: NavigationIntake
}

export type NavigationFileKind = 'report' | 'broker-kit'

export interface DownloadNavigationFileRequest {
  navigationId: string
  kind: NavigationFileKind
}

/** A download, as an object URL the caller clicks and revokes. */
export interface DownloadedFile {
  url: string
  filename: string
}

export type NavigationVerdict = NavigationFeedback['verdict']

export interface SubmitNavigationFeedbackRequest {
  navigationId: string
  /** The analysis the navigation belongs to, so its cached detail is refreshed. */
  analysisId: string
  verdict: NavigationVerdict
  sections: Partial<Record<NavigationSection, SectionFeedback>>
  notes: string
}
