import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/renderWithProviders'

import { SUMMARY } from '../lib/innovadermSummary.fixture'
import { navigationResponseSchema } from '../model/navigation'
import { NavigationReport } from './NavigationReport'

function runWith(result: unknown, overrides: Record<string, unknown> = {}) {
  return navigationResponseSchema.parse({
    navigation_id: 'nav-1',
    analysis_id: 'an-1',
    patient_id: 'PAC-2026-0021',
    status: 'succeeded',
    created_at: '2026-09-14T10:00:00Z',
    latency_ms: 184000,
    result,
    ...overrides,
  })
}

describe('NavigationReport', () => {
  it('renders the coordinator report sections', () => {
    renderWithProviders(<NavigationReport run={runWith(SUMMARY)} />)

    for (const title of [
      '1. Resumen Ejecutivo',
      '2. Extracción de Póliza (Agent 1 — Parser)',
      '3. Alertas de Aseguradora',
      '4. Fechas Límite',
      '5. Plan de Acción (Agent 2 — Planner)',
      '6. Checklist de Documentación',
      '7. Proyección de Costos (Agent 2)',
      '8. Roadmap Financiero — 12 Meses (Agent 4 — Optimizer)',
      '9. Adherencia y Monitoreo (Agent 5 — Monitor)',
      '10. Vía de Apelación (Agent 3 — Advocate)',
      '11. Carta de Notificación de Siniestro',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(screen.getByText('URGENCIA: CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('🚨 MetLife: Programar pago directo')).toBeInTheDocument()
    expect(screen.getByText('Paso 1: Enviar notificación de siniestro')).toBeInTheDocument()
    expect(screen.getAllByText('[NOMBRE_COMPLETO_PACIENTE]').length).toBeGreaterThan(0)
    expect(screen.getByText('El precio de Nemluvio se verificó el 2026-05-22.')).toBeInTheDocument()
  })

  it('names the agents that fell back', () => {
    renderWithProviders(<NavigationReport run={runWith(SUMMARY, { degraded_agents: ['optimizer'] })} />)
    expect(screen.getByText(/Optimizador — costos a 12 meses/)).toBeInTheDocument()
  })

  it('explains a run stored before the port instead of rendering it', () => {
    renderWithProviders(<NavigationReport run={runWith({ urgencia: 'critica', alertas: [] })} />)
    expect(screen.getByText(/Vuelva a ejecutarla/)).toBeInTheDocument()
  })
})
