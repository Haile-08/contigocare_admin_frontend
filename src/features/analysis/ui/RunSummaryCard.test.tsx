import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import { RunSummaryCard } from './RunSummaryCard'

const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

const analysis = analisisSchema.parse({
  datos_poliza: { aseguradora: { valor: 'GNP', confianza: 'alta' } },
  coberturas: {},
  hallazgos: [
    { severidad: 'critica', categoria: 'cobertura', descripcion_es: 'x', description_en: 'x' },
  ],
})

const meta = analyzeResponseSchema.parse({
  analysis_id: '0f2b1c8e-0000-4000-8000-000000000001',
  patient_id: 'PAC-2026-0020',
  status: 'succeeded',
  created_at: RUN_AT,
})

function renderCard() {
  return renderWithProviders(<RunSummaryCard analysis={analysis} meta={meta} />, {
    preloadedState: { ui: uiStateWith({ locale: 'es' }) },
  })
}

describe('RunSummaryCard', () => {
  it('shows the five identifying fields with their Spanish labels', () => {
    renderCard()

    for (const label of [
      'Paciente (ID)',
      'Aseguradora',
      'Nivel de Urgencia',
      'Run ID',
      'Fecha de generación',
    ]) {
      expect(screen.getByRole('rowheader', { name: label })).toBeInTheDocument()
    }

    expect(screen.getByText('PAC-2026-0020')).toBeInTheDocument()
    expect(screen.getByText('GNP')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('20260522_131210')).toBeInTheDocument()
    expect(screen.getByText('2026-05-22 13:12')).toBeInTheDocument()
  })

  it('copies the table as two tab-separated columns', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup({ writeToClipboard: false })
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    renderCard()
    await user.click(screen.getByRole('button', { name: /Copiar/ }))

    expect(writeText).toHaveBeenCalledWith(
      [
        'Campo\tValor',
        'Paciente (ID)\tPAC-2026-0020',
        'Aseguradora\tGNP',
        'Nivel de Urgencia\tCRITICAL',
        'Run ID\t20260522_131210',
        'Fecha de generación\t2026-05-22 13:12',
      ].join('\n'),
    )
    await waitFor(() => expect(screen.getByRole('button', { name: /Copiado/ })).toBeInTheDocument())

    vi.unstubAllGlobals()
  })

  it('says so when the clipboard is unavailable, rather than looking like it worked', async () => {
    const user = userEvent.setup({ writeToClipboard: false })
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })

    renderCard()
    await user.click(screen.getByRole('button', { name: /Copiar/ }))

    expect(await screen.findByRole('status')).toHaveTextContent('No se pudo copiar')

    vi.unstubAllGlobals()
  })
})
