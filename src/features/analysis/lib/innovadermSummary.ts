/**
 * InnovaDerm's summary, read the way its coordinator report reads it.
 *
 * The backend renders the PDF from the same summary in
 * `app/core/navigator/report.py`, which is the handover's report generator. This
 * mirrors that file section for section — the same labels, the same formatting
 * of `Sí`/`No`/`—` and `$12,345 MXN`, the same rows — so the screen and the
 * downloaded document never disagree about a value.
 *
 * The labels are Spanish whatever the console's language, as they are in the
 * report: it is the document the coordinator hands on, and its terms are Mexican
 * contract language.
 *
 * Everything the model produced is read defensively. The planner decides the
 * shape of an appeal pathway; a fallback plan has no steps; a failed parser has
 * no confidence. A missing part renders as absent, never as an error.
 */

export type Row = [label: string, value: string]

export type AlertTone = 'critical' | 'warning' | 'positive'

export interface PlanStep {
  heading: string
  action: string
  meta: string
  docs: string[]
  note: string
}

export interface OptimizationTip {
  title: string
  action: string
  meta: string
  risk: string
}

export interface ExtractionGroup {
  title: string
  rows: Row[]
}

export interface ChecklistGroup {
  title: string
  items: string[]
}

export interface SummaryView {
  cover: Row[]
  urgency: string
  executiveSummary: string
  extraction: { meta: Row[]; groups: ExtractionGroup[]; flags: string[] } | null
  alerts: { text: string; tone: AlertTone }[]
  deadlines: Row[]
  steps: PlanStep[]
  checklist: ChecklistGroup[]
  costs: Row[]
  optimizationTip: string
  roadmap: {
    rows: Row[]
    monthly: string[][]
    tips: OptimizationTip[]
    renewal: Row[]
    tactics: string[]
  } | null
  adherence: {
    metrics: Row[]
    mostUrgent: { text: string; deadline: string } | null
    doses: string[][]
    monitoring: string[][]
    reauthDocs: string[][]
    continuityRisk: { level: string; factors: string[]; mitigation: string[] } | null
    tips: string[]
  } | null
  appeal: { trigger: string; steps: string[][]; arguments: string[]; timeline: string } | null
  notificationLetter: string | null
  appealPackage: {
    letter: Row[]
    condusef: string
    arguments: string[]
    documents: string[]
    probability: string
    notes: string
    error: string
    privacyWarning: string
  } | null
  warnings: string[]
}

export const MONTHLY_HEADERS = ['Mes', 'Fecha', 'Dosis', 'Costo med.', 'Deducible', 'Coaseguro', 'Paciente paga', 'Tope?']
export const DOSE_HEADERS = ['#', 'Fecha programada', 'Tipo', 'Estado', 'Ordenar refill antes de']
export const MONITORING_HEADERS = ['Fecha', 'Descripción', 'Tipo', 'Responsable', 'Crítico']
export const REAUTH_HEADERS = ['Documento', 'Antigüedad máx.', 'Responsable', 'Crítico']
export const APPEAL_HEADERS = ['Paso', 'Acción', 'Plazo']

type Json = Record<string, unknown>

function asRecord(value: unknown): Json {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

const moneyFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })

/** The report's `fmt_currency`: `$12,345 MXN`, or the value as text. */
export function fmtCurrency(value: unknown): string {
  if (isNumber(value)) return `$${moneyFormat.format(value)} MXN`
  return value ? text(value) : '—'
}

/** The report's `fmt_val`: `—` for nothing, `Sí`/`No` for a boolean. */
export function fmtVal(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return text(value)
}

function capitalize(value: unknown): string {
  const raw = text(value)
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : ''
}

function hasValue(section: Json): boolean {
  return Object.values(section).some((value) => value !== null && value !== undefined && !Array.isArray(value))
}

function anyNonNull(section: Json): boolean {
  return Object.values(section).some((value) => value !== null && value !== undefined)
}

const STEP_OWNER: Record<string, string> = {
  psp_coordinator: 'Coordinador PSP',
  doctor: 'Médico tratante',
  patient: 'Paciente',
}

const TIP_OWNER: Record<string, string> = { coordinator: 'Coordinador PSP', doctor: 'Médico', patient: 'Paciente' }

const CALENDAR_OWNER: Record<string, string> = { doctor: 'Médico', patient: 'Paciente', coordinator: 'Coordinador' }

/** Whether a stored result is an InnovaDerm summary at all. Runs stored before the port are not. */
export function isInnovadermSummary(result: unknown): result is Json {
  const summary = asRecord(result)
  return 'action_plan' in summary && 'financial_roadmap' in summary
}

function extractionView(policyExtraction: Json): SummaryView['extraction'] {
  if (Object.keys(policyExtraction).length === 0) return null

  const meta = asRecord(policyExtraction['meta'])
  const confidence = meta['confidence_score']
  const metaRows: Row[] = [
    ['Aseguradora', fmtVal(meta['carrier'])],
    ['Tipo de póliza', fmtVal(meta['policy_type'])],
    ['Confianza de extracción', isNumber(confidence) ? percentFormat.format(confidence) : text(confidence)],
    ['Fecha de extracción', fmtVal(meta['extraction_date'])],
  ]

  const groups: ExtractionGroup[] = []
  const fin = asRecord(policyExtraction['financial'])
  if (anyNonNull(fin)) {
    groups.push({
      title: 'Datos Financieros',
      rows: [
        ['Deducible', fmtVal(fin['deducible_amount'])],
        ['Tipo de deducible', fmtVal(fin['deducible_type'])],
        ['Coaseguro (%)', fmtVal(fin['coaseguro_pct'])],
        ['Tope de coaseguro', fmtVal(fin['tope_coaseguro'])],
        ['Suma asegurada', fmtVal(fin['suma_asegurada'])],
        ['Moneda', fmtVal(fin['moneda'])],
        ['Periodo de póliza', fmtVal(fin['periodo_poliza'])],
      ],
    })
  }
  const cov = asRecord(policyExtraction['coverage'])
  if (anyNonNull(cov)) {
    groups.push({
      title: 'Cobertura',
      rows: [
        ['Biológicos cubiertos', fmtVal(cov['biologics_covered'])],
        ['Meds especialidad cubiertos', fmtVal(cov['specialty_meds_covered'])],
        ['Pago directo disponible', fmtVal(cov['pago_directo_available'])],
        ['Pago directo medicamentos', fmtVal(cov['pago_directo_meds'])],
        ['Coaseguro meds ambulatorio', fmtVal(cov['coaseguro_meds_outpatient'])],
        ['Programación requerida', fmtVal(cov['programacion_required'])],
        ['Red requerida', fmtVal(cov['network_required'])],
      ],
    })
  }
  const pre = asRecord(policyExtraction['preexisting'])
  if (anyNonNull(pre)) {
    groups.push({
      title: 'Padecimientos Preexistentes',
      rows: [
        ['Excluidos', fmtVal(pre['excluded'])],
        ['Vía de cobertura', fmtVal(pre['pathway_to_coverage'])],
        ['Cobertura después de (meses)', fmtVal(pre['coverage_after_months'])],
        ['Rider opcional disponible', fmtVal(pre['optional_rider_available'])],
        ['Regla de 30 días', fmtVal(pre['thirty_day_rule'])],
      ],
    })
  }
  const derm = asRecord(policyExtraction['dermatology'])
  if (hasValue(derm)) {
    groups.push({
      title: 'Dermatología',
      rows: [
        ['Productos derm excluidos', fmtVal(derm['derm_products_excluded'])],
        ['Biológicos excluidos', fmtVal(derm['biologics_excluded'])],
        ['Cosméticos excluidos', fmtVal(derm['cosmetic_excluded'])],
        ['Lesiones piel → 2a valoración', fmtVal(derm['skin_lesions_segunda_val'])],
        ['Acné excluido', fmtVal(derm['acne_excluded'])],
      ],
    })
  }
  const appeals = asRecord(policyExtraction['appeals'])
  if (anyNonNull(appeals)) {
    groups.push({
      title: 'Apelaciones y Recursos',
      rows: [
        ['Plazo notificación (días)', fmtVal(appeals['notification_deadline_days'])],
        ['Tipo de notificación', fmtVal(appeals['notification_type'])],
        ['Recurso preexistentes', fmtVal(appeals['preexisting_appeal_type'])],
        ['Cuerpo de arbitraje', fmtVal(appeals['arbitration_body'])],
        ['UNE suspende prescripción', fmtVal(appeals['une_suspends_statute'])],
        ['CONDUSEF disponible', fmtVal(appeals['condusef_available'])],
        ['Plazo liquidación (días)', fmtVal(appeals['settlement_days'])],
      ],
    })
  }

  return { meta: metaRows, groups, flags: asArray(policyExtraction['_flags']).map(text) }
}

function alertTone(alert: string): AlertTone {
  if (alert.startsWith('🚨') || alert.startsWith('🔴')) return 'critical'
  if (alert.startsWith('⚠️') || alert.startsWith('🟡')) return 'warning'
  return 'positive'
}

function roadmapView(finRoadmap: Json): SummaryView['roadmap'] {
  const summary = asRecord(finRoadmap['financial_summary'])
  if (Object.keys(summary).length === 0) return null

  const topeMonth = summary['tope_reached_month']
  const freeMonths = summary['months_remaining_free']
  const rows: Row[] = [
    ['Costo anual del medicamento', fmtCurrency(summary['drug_cost_annual_mxn'] ?? 0)],
    ['Costo anual del paciente (optimizado)', fmtCurrency(summary['patient_cost_annual_mxn'] ?? 0)],
    ['Costo sin optimización', fmtCurrency(summary['cost_without_optimization_mxn'] ?? 0)],
    ['Ahorro por optimización', fmtCurrency(summary['savings_from_optimization_mxn'] ?? 0)],
    ['Costo que absorbe la aseguradora', fmtCurrency(summary['carrier_cost_annual_mxn'] ?? 0)],
    ['Tope de coaseguro alcanzado', topeMonth ? `Mes ${text(topeMonth)}` : 'No alcanzado en 12 meses'],
    ['Meses restantes sin costo', freeMonths ? `${text(freeMonths)} meses` : '—'],
  ]

  const monthly = asArray(finRoadmap['monthly_projections']).map((entry) => {
    const month = asRecord(entry)
    return [
      text(month['month']),
      text(month['date']),
      text(month['doses']),
      fmtCurrency(month['drug_cost_mxn']),
      fmtCurrency(month['deducible_mxn']),
      fmtCurrency(month['coaseguro_mxn']),
      fmtCurrency(month['patient_pays_mxn']),
      month['tope_reached'] ? 'Sí' : 'No',
    ]
  })

  const tips = asArray(finRoadmap['optimization_tips'])
    .filter((entry) => entry !== null && typeof entry === 'object')
    .map((entry) => {
      const tip = asRecord(entry)
      const meta: string[] = []
      const owner = text(tip['owner'])
      if (owner) meta.push(`Responsable: ${TIP_OWNER[owner] ?? owner}`)
      if (tip['timing']) meta.push(`Timing: ${text(tip['timing'])}`)
      if (tip['savings_estimate_mxn']) meta.push(`Ahorro est: ${fmtCurrency(tip['savings_estimate_mxn'])}`)
      return {
        title: text(tip['title']),
        action: text(tip['action']),
        meta: meta.join(' | '),
        risk: text(tip['risk_if_ignored']),
      }
    })

  const renewal = asRecord(finRoadmap['renewal_projection'])
  const renewalRows: Row[] = []
  if (renewal['premium_increase_estimate_pct']) {
    renewalRows.push(['Aumento de prima estimado', `${text(renewal['premium_increase_estimate_pct'])}%`])
  }
  if (renewal['stay_vs_switch_recommendation']) {
    renewalRows.push(['Recomendación', text(renewal['stay_vs_switch_recommendation'])])
  }
  if (renewal['continuity_risk']) renewalRows.push(['Riesgo de continuidad', text(renewal['continuity_risk'])])
  if (renewal['optimal_renewal_action']) {
    renewalRows.push(['Acción óptima de renovación', text(renewal['optimal_renewal_action'])])
  }

  return { rows, monthly, tips, renewal: renewalRows, tactics: asArray(renewal['negotiation_tactics']).map(text) }
}

function adherenceView(adherence: Json): SummaryView['adherence'] {
  if (Object.keys(adherence).length === 0) return null

  const activeAlerts = adherence['active_alerts']
  const metrics: Row[] = [
    ['Score de adherencia', `${text(adherence['adherence_score'] ?? 'N/A')}/100`],
    ['Dosis programadas (12 meses)', text(adherence['total_doses_12_months'] ?? '—')],
    ['Eventos de monitoreo', text(adherence['total_monitoring_events'] ?? '—')],
    ['Alertas activas', Array.isArray(activeAlerts) ? String(activeAlerts.length) : text(activeAlerts)],
  ]

  const urgent = asRecord(adherence['most_urgent'])
  const mostUrgent = urgent['action']
    ? { text: `${text(urgent['title'])} — ${text(urgent['action'])}`, deadline: text(urgent['deadline']) }
    : null

  const doses = asArray(adherence['dose_calendar']).map((entry) => {
    const dose = asRecord(entry)
    return [
      text(dose['dose_number']),
      text(dose['scheduled_date']),
      capitalize(dose['type']),
      capitalize(dose['status']),
      text(dose['refill_order_by']),
    ]
  })

  const monitoring = asArray(adherence['monitoring_calendar']).map((entry) => {
    const event = asRecord(entry)
    const owner = text(event['owner'])
    return [
      text(event['scheduled_date']),
      text(event['title']),
      text(event['event']),
      CALENDAR_OWNER[owner] ?? owner,
      event['critical'] ? '⚠️' : '',
    ]
  })

  const reauthDocs = asArray(adherence['reauth_docs_required']).map((entry) => {
    const doc = asRecord(entry)
    const owner = text(doc['owner'])
    return [
      text(doc['doc']),
      `${text(doc['max_age_months'] ?? '—')} meses`,
      CALENDAR_OWNER[owner] ?? owner,
      doc['critical'] ? '⚠️ Sí' : 'No',
    ]
  })

  const risk = adherence['continuity_risk']
  const riskRecord = asRecord(risk)
  const continuityRisk =
    risk !== null && typeof risk === 'object'
      ? {
          level: text(riskRecord['risk_level'] ?? 'unknown').toUpperCase(),
          factors: asArray(riskRecord['risk_factors']).map(text),
          mitigation: asArray(riskRecord['mitigation_actions']).map(text),
        }
      : null

  return {
    metrics,
    mostUrgent,
    doses,
    monitoring,
    reauthDocs,
    continuityRisk,
    tips: asArray(asRecord(adherence['adherence_plan'])['patient_engagement_tips']).map(text),
  }
}

function appealView(appeal: unknown): SummaryView['appeal'] {
  const pathway = asRecord(appeal)
  if (Object.keys(pathway).length === 0) return null

  const steps: string[][] = []
  for (let index = 1; index <= 5; index += 1) {
    const key = `step_${index}`
    if (!(key in pathway)) continue
    const step = asRecord(pathway[key])
    const deadline =
      step['deadline_from_denial'] ||
      step['deadline_from_une_response'] ||
      step['deadline_from_condusef'] ||
      step['deadline_relative'] ||
      '—'
    steps.push([`Paso ${index}`, text(step['action']), text(deadline)])
  }

  return {
    trigger: text(pathway['trigger']),
    steps,
    arguments: asArray(pathway['key_arguments']).map(text),
    timeline: text(pathway['estimated_resolution_timeline']),
  }
}

function appealPackageView(pkg: unknown): SummaryView['appealPackage'] {
  if (pkg === null || typeof pkg !== 'object') return null
  const record = asRecord(pkg)
  const letter = asRecord(record['carta_apelacion'])
  return {
    letter: [
      ['Destinatario', text(letter['destinatario'])],
      ['Asunto', text(letter['asunto'])],
      ['Cuerpo', text(letter['cuerpo'])],
      ['Cierre', text(letter['cierre'])],
      ['Firma', text(letter['firma_block'])],
    ].filter((row): row is Row => row[1] !== ''),
    condusef: asRecord(record['carta_condusef'])['aplica'] ? text(asRecord(record['carta_condusef'])['cuerpo']) : '',
    arguments: asArray(record['argumentos_clave']).map(text),
    documents: asArray(record['docs_adicionales']).map(text),
    probability: text(record['probabilidad_exito']),
    notes: text(record['notas_estrategicas']),
    error: text(record['_error']),
    privacyWarning: text(record['_privacy_warning']),
  }
}

/** The summary as the report's sections. `null` for a result that is not an InnovaDerm summary. */
export function buildSummaryView(result: unknown, generatedAt: string): SummaryView | null {
  if (!isInnovadermSummary(result)) return null
  const summary = result

  const carrier = text(summary['carrier'] ?? 'Unknown')
  const urgency = text(summary['urgency_level'] || 'medium')
  const plan = asRecord(summary['action_plan'])
  const deadlines = asRecord(summary['deadlines'])
  const cost = asRecord(summary['cost_projection'])
  const docs = asRecord(summary['docs_checklist'])

  const steps = asArray(plan['steps']).map((entry) => {
    const step = asRecord(entry)
    const meta: string[] = []
    if (step['deadline']) meta.push(`Fecha límite: ${text(step['deadline'])}`)
    const owner = text(step['owner'])
    if (owner) meta.push(`Responsable: ${STEP_OWNER[owner] ?? owner}`)
    return {
      heading: `Paso ${text(step['step'])}: ${text(step['title'])}`,
      action: text(step['action']),
      meta: meta.join(' | '),
      docs: asArray(step['docs_needed']).map(text),
      note: text(step['carrier_specific_note']),
    }
  })

  const checklist: ChecklistGroup[] = (
    [
      ['clinical', 'Documentos Clínicos'],
      ['insurance', 'Documentos de Seguro'],
      ['carrier_specific', `Documentos Específicos ${carrier}`],
    ] as const
  )
    .map(([key, title]) => ({ title, items: asArray(docs[key]).map(text) }))
    .filter((group) => group.items.length > 0)

  const letter = summary['notification_letter']

  return {
    cover: [
      ['Paciente (ID)', text(summary['patient_id'] ?? 'PAC-XXXX-XXXX')],
      ['Aseguradora', carrier],
      ['Nivel de Urgencia', urgency.toUpperCase()],
      ['Run ID', text(summary['run_id'] ?? 'unknown')],
      ['Fecha de generación', generatedAt],
    ],
    urgency,
    executiveSummary: text(plan['summary']) || 'Sin resumen disponible.',
    extraction: extractionView(asRecord(summary['policy_extraction'])),
    alerts: asArray(summary['carrier_alerts']).map((alert) => ({ text: text(alert), tone: alertTone(text(alert)) })),
    deadlines: [
      ['Notificación de siniestro', text(deadlines['notification'] ?? '—')],
      ['Envío de preautorización', text(deadlines['preauth_submit'] ?? '—')],
      ['Primera dosis (más temprano)', text(deadlines['first_dose_earliest'] ?? '—')],
    ],
    steps,
    checklist,
    costs: [
      ['Deducible', text(cost['deducible'] ?? '—')],
      ['Coaseguro (%)', text(cost['coaseguro_pct'] ?? '—')],
      ['Tope de coaseguro', text(cost['tope_coaseguro'] ?? '—')],
      ['Costo mensual medicamento (est.)', fmtCurrency(cost['monthly_drug_cost_estimate_mxn'])],
      ['Costo mensual paciente (est.)', fmtCurrency(cost['patient_monthly_estimate_mxn'])],
    ],
    optimizationTip: text(cost['optimization_tip']),
    roadmap: roadmapView(asRecord(summary['financial_roadmap'])),
    adherence: adherenceView(asRecord(summary['adherence'])),
    appeal: appealView(plan['appeal_pathway']),
    notificationLetter: typeof letter === 'string' && letter ? letter : null,
    appealPackage: appealPackageView(summary['appeal_package']),
    warnings: asArray(summary['_warnings']).map(text),
  }
}

/** A letter line split into plain text and `[PLACEHOLDER]` runs, for highlighting. */
export function splitPlaceholders(line: string): { text: string; placeholder: boolean }[] {
  return line
    .split(/(\[[^\]]+\])/)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, placeholder: /^\[[^\]]+\]$/.test(part) }))
}
