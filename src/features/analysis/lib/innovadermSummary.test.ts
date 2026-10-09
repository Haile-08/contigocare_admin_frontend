import { describe, expect, it } from 'vitest'

import { SUMMARY } from './innovadermSummary.fixture'
import { buildSummaryView, fmtCurrency, fmtVal, isInnovadermSummary, splitPlaceholders } from './innovadermSummary'

describe('formatting, as the report formats', () => {
  it('prints values and money the way the PDF report does', () => {
    expect(fmtVal(null)).toBe('—')
    expect(fmtVal(true)).toBe('Sí')
    expect(fmtVal(false)).toBe('No')
    expect(fmtCurrency(25300)).toBe('$25,300 MXN')
    expect(fmtCurrency(null)).toBe('—')
    expect(fmtCurrency('ver carátula')).toBe('ver carátula')
  })

  it('splits placeholders out of a letter line', () => {
    expect(splitPlaceholders('Póliza [NÚMERO_DE_PÓLIZA].')).toEqual([
      { text: 'Póliza ', placeholder: false },
      { text: '[NÚMERO_DE_PÓLIZA]', placeholder: true },
      { text: '.', placeholder: false },
    ])
  })
})

describe('buildSummaryView', () => {
  const view = buildSummaryView(SUMMARY, '14 sep 2026')

  it('refuses a result that is not an InnovaDerm summary', () => {
    expect(isInnovadermSummary({ urgencia: 'critica' })).toBe(false)
    expect(buildSummaryView({ urgencia: 'critica' }, 'x')).toBeNull()
  })

  it('builds the cover, alerts and deadlines', () => {
    expect(view?.cover).toContainEqual(['Nivel de Urgencia', 'CRITICAL'])
    expect(view?.alerts.map((alert) => alert.tone)).toEqual(['critical', 'warning', 'positive'])
    expect(view?.deadlines).toEqual([
      ['Notificación de siniestro', '2026-09-17'],
      ['Envío de preautorización', '2026-09-19'],
      ['Primera dosis (más temprano)', '—'],
    ])
  })

  it('builds the extraction groups the report prints', () => {
    expect(view?.extraction?.meta).toContainEqual(['Confianza de extracción', '82%'])
    expect(view?.extraction?.groups.map((group) => group.title)).toEqual([
      'Datos Financieros',
      'Cobertura',
      'Padecimientos Preexistentes',
      'Dermatología',
      'Apelaciones y Recursos',
    ])
    expect(view?.extraction?.groups[3]?.rows).toContainEqual(['Cosméticos excluidos', 'Sí'])
  })

  it('builds the plan, checklist and costs', () => {
    expect(view?.steps[0]?.heading).toBe('Paso 1: Enviar notificación de siniestro')
    expect(view?.steps[0]?.meta).toBe('Fecha límite: 2026-09-17 | Responsable: Coordinador PSP')
    expect(view?.checklist.map((group) => group.title)).toEqual(['Documentos Clínicos', 'Documentos Específicos MetLife'])
    expect(view?.costs).toContainEqual(['Coaseguro (%)', '—'])
    expect(view?.costs).toContainEqual(['Costo mensual medicamento (est.)', '$30,000 MXN'])
  })

  it('builds the roadmap and adherence tables', () => {
    expect(view?.roadmap?.rows).toContainEqual(['Tope de coaseguro alcanzado', 'Mes 4'])
    expect(view?.roadmap?.monthly[0]).toEqual(['1', '2026-01', '2', '$90,000 MXN', '$15,000 MXN', '$7,500 MXN', '$22,500 MXN', 'No'])
    expect(view?.roadmap?.tips[0]?.meta).toBe('Responsable: Coordinador PSP | Timing: immediate | Ahorro est: $25,300 MXN')
    expect(view?.roadmap?.renewal).toEqual([['Aumento de prima estimado', '8%']])
    expect(view?.adherence?.metrics).toContainEqual(['Score de adherencia', '72/100'])
    expect(view?.adherence?.doses[0]).toEqual(['1', '2026-09-28', 'Standard', 'Scheduled', '2026-09-21'])
    expect(view?.adherence?.reauthDocs[0]).toEqual(['DLQI actualizado', '6 meses', 'Médico', '⚠️ Sí'])
    expect(view?.adherence?.continuityRisk?.level).toBe('MEDIUM')
  })

  it('builds the appeal pathway and letter', () => {
    expect(view?.appeal?.steps).toEqual([['Paso 1', 'Queja ante la UNE', '30 días']])
    expect(view?.notificationLetter).toContain('[NOMBRE_COMPLETO_PACIENTE]')
    expect(view?.appealPackage).toBeNull()
    expect(view?.warnings).toHaveLength(1)
  })
})
