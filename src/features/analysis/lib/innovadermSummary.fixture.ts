/** A finished InnovaDerm summary, shaped as the backend stores it, for tests. */
export const SUMMARY = {
  run_id: '20260914_101500',
  patient_id: 'PAC-2026-0021',
  carrier: 'MetLife',
  urgency_level: 'critical',
  policy_confidence: 0.82,
  action_plan: {
    summary: 'Paciente MetLife con dermatitis atópica.',
    steps: [
      {
        step: 1,
        title: 'Enviar notificación de siniestro',
        action: 'Enviar aviso por escrito.',
        deadline: '2026-09-17',
        owner: 'psp_coordinator',
        docs_needed: ['Aviso de siniestro'],
        carrier_specific_note: '5 días naturales.',
      },
    ],
    appeal_pathway: {
      trigger: 'Negativa por preexistencia',
      step_1: { action: 'Queja ante la UNE', deadline_relative: '30 días' },
      key_arguments: ['24 meses de antigüedad'],
    },
  },
  notification_letter:
    'Ciudad de México\nPor medio de la presente, [NOMBRE_COMPLETO_PACIENTE], póliza [NÚMERO_DE_PÓLIZA].\n---\nPie',
  policy_extraction: {
    meta: { carrier: 'MetLife', policy_type: 'Individual', confidence_score: 0.82, extraction_date: '2026-09-14' },
    financial: { deducible_amount: null, coaseguro_pct: 10, tope_coaseguro: null },
    coverage: { pago_directo_meds: true },
    preexisting: { excluded: false, coverage_after_months: 24 },
    dermatology: { cosmetic_excluded: true, waiting_periods_derm: [] },
    appeals: { notification_deadline_days: 5, une_suspends_statute: true },
    _flags: ['MetLife: verify programación pago directo 0% coaseguro clause'],
  },
  financial_roadmap: {
    financial_summary: {
      drug_cost_annual_mxn: 420000,
      patient_cost_annual_mxn: 40300,
      cost_without_optimization_mxn: 40300,
      savings_from_optimization_mxn: 0,
      carrier_cost_annual_mxn: 379700,
      tope_reached_month: 4,
      months_remaining_free: 8,
    },
    monthly_projections: [
      {
        month: 1,
        date: '2026-01',
        doses: 2,
        drug_cost_mxn: 90000,
        deducible_mxn: 15000,
        coaseguro_mxn: 7500,
        patient_pays_mxn: 22500,
        tope_reached: false,
      },
    ],
    optimization_tips: [
      { title: 'Programación', action: 'Agendar.', owner: 'coordinator', timing: 'immediate', savings_estimate_mxn: 25300 },
    ],
    renewal_projection: { premium_increase_estimate_pct: 8, negotiation_tactics: ['Negociar'] },
  },
  adherence: {
    adherence_score: 72,
    total_doses_12_months: 14,
    total_monitoring_events: 19,
    active_alerts: [],
    most_urgent: { title: 'Ordenar dosis', action: 'Pedir.', deadline: '2026-09-21' },
    continuity_risk: { risk_level: 'medium', risk_factors: ['Inicio'], mitigation_actions: [] },
    dose_calendar: [
      { dose_number: 1, scheduled_date: '2026-09-28', type: 'standard', status: 'scheduled', refill_order_by: '2026-09-21' },
    ],
    monitoring_calendar: [
      { scheduled_date: '2026-09-28', title: 'Panel', event: 'lab_panel', owner: 'doctor', critical: true },
    ],
    reauth_docs_required: [{ doc: 'DLQI actualizado', max_age_months: 6, owner: 'doctor', critical: true }],
    adherence_plan: { patient_engagement_tips: ['Mantener calendario'] },
  },
  appeal_package: null,
  carrier_alerts: ['🚨 MetLife: Programar pago directo', '⚠️ URGENTE: Quedan 2 día(s)', 'Alerta del planificador'],
  docs_checklist: { clinical: ['EASI'], insurance: [], carrier_specific: ['Programación'] },
  deadlines: { notification: '2026-09-17', preauth_submit: '2026-09-19', first_dose_earliest: null },
  cost_projection: { deducible: 'from carátula', coaseguro_pct: null, monthly_drug_cost_estimate_mxn: 30000 },
  _warnings: ['El precio de Nemluvio se verificó el 2026-05-22.'],
}
