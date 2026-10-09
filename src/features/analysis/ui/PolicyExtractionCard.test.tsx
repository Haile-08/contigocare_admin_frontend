import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { analisisSchema, analyzeResponseSchema } from '../model/types'
import { PolicyExtractionCard } from './PolicyExtractionCard'

const RUN_AT = new Date(2026, 4, 22, 13, 12, 10).toISOString()

const found = (valor: string) => ({ valor, confianza: 'alta', evidencia: `cita: ${valor}` })

const analysis = analisisSchema.parse({
  identificacion: {
    aseguradora: found('GNP'),
    vigencia_inicio: found('30/05/2025'),
  },
  estructura_financiera: {
    deducible: found('$19,500.00'),
    coaseguro_porcentaje: found('10%'),
    tope_coaseguro: found('$68,000.00'),
  },
  preexistencias_continuidad: {
    antiguedad: { valor: null, confianza: 'no_encontrado' },
  },
})

const meta = analyzeResponseSchema.parse({
  analysis_id: '0f2b1c8e-0000-4000-8000-000000000001',
  patient_id: 'PAC-2026-0020',
  status: 'succeeded',
  created_at: RUN_AT,
})

function renderCard() {
  return renderWithProviders(<PolicyExtractionCard analysis={analysis} meta={meta} />, {
    preloadedState: { ui: uiStateWith({ locale: 'es' }) },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PolicyExtractionCard', () => {
  it('states the values the navigation starts from, in three groups', () => {
    renderCard()

    for (const heading of [
      'Identificación y administrativo',
      'Estructura financiera',
      'Preexistencias y continuidad',
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument()
    }
    expect(screen.queryByText('Alcance de la cobertura')).not.toBeInTheDocument()

    expect(screen.getByText('GNP')).toBeInTheDocument()
    expect(screen.getByText('30/05/2025')).toBeInTheDocument()
    expect(screen.getByText('$19,500.00')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('$68,000.00')).toBeInTheDocument()
  })

  it('says a field was not found rather than showing an empty cell', () => {
    renderCard()

    const row = screen.getByText('Antigüedad').closest('div')
    expect(within(row as HTMLElement).getByText('No encontrado')).toBeInTheDocument()
  })

  it('shows a derived row as a value, not as a field the agent failed to find', () => {
    renderCard()

    // The extraction score has no `Campo` behind it. Reading "no field" as
    // "not found" would report a gap that is not there.
    const row = screen.getByText('Confianza de extracción').closest('div')
    expect(within(row as HTMLElement).queryByText('No encontrado')).not.toBeInTheDocument()
  })

  it('shows the line of the policy a value came from', async () => {
    const user = userEvent.setup()
    renderCard()

    expect(screen.queryByText('cita: $19,500.00')).not.toBeInTheDocument()

    const row = screen.getByText('Deducible').closest('div')
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Ver fuente' }))

    expect(screen.getByText('cita: $19,500.00')).toBeInTheDocument()
  })

  it('downloads a PDF named after the patient and the run', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn().mockReturnValue('blob:extraction')
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('PAC-2026-0020_20260522_131210.pdf')
        expect(this.href).toBe('blob:extraction')
      })

    renderCard()
    await user.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    expect(click).toHaveBeenCalledOnce()
    expect(createObjectURL).toHaveBeenCalledOnce()

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })

  it('lets the reviewer correct a value the analysis misread', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button', { name: /Editar valores/ }))

    const field = screen.getByRole('textbox', { name: 'Valor de Deducible' })
    expect(field).toHaveValue('$19,500.00')

    await user.clear(field)
    await user.type(field, '$15,000.00')
    await user.click(screen.getByRole('button', { name: /Terminar edición/ }))

    expect(screen.getByText('$15,000.00')).toBeInTheDocument()
    // The extracted value stays on screen: the correction is a disagreement
    // with the analysis, and the reader needs both sides of it.
    expect(screen.getByText('Extraído: $19,500.00')).toBeInTheDocument()
    expect(screen.getByText(/Se corrigió 1 valor a mano/)).toBeInTheDocument()
  })

  it('keeps the run’s own figures out of reach', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button', { name: /Editar valores/ }))

    // The extraction score is a claim about the run, not about the contract.
    expect(
      screen.queryByRole('textbox', { name: 'Valor de Confianza de extracción' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Valor de Aseguradora' })).toBeInTheDocument()
  })

  it('restores the extracted value', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button', { name: /Editar valores/ }))
    await user.type(screen.getByRole('textbox', { name: 'Valor de Deducible' }), '0')

    // The only revert button on the page: an untouched row has nothing to
    // restore and so offers no control to do it with.
    await user.click(screen.getByRole('button', { name: 'Restaurar el valor extraído' }))

    expect(screen.getByRole('textbox', { name: 'Valor de Deducible' })).toHaveValue('$19,500.00')
    expect(screen.queryByText(/Se corrigió/)).not.toBeInTheDocument()
  })

  it('exports the corrected value, marked as a correction', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn().mockReturnValue('blob:extraction')
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderCard()

    await user.click(screen.getByRole('button', { name: /Editar valores/ }))
    const field = screen.getByRole('textbox', { name: 'Valor de Deducible' })
    await user.clear(field)
    await user.type(field, '$15,000.00')
    await user.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    const file = await blob.text()

    expect(file).toContain('($15,000.00) Tj')
    expect(file).not.toContain('($19,500.00) Tj')
    expect(file).toContain('(Deducible *) Tj')

    vi.unstubAllGlobals()
  })

  it('says the export failed rather than leaving the operator waiting', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => {
        throw new Error('no blob urls here')
      }),
      revokeObjectURL: vi.fn(),
    })

    renderCard()
    await user.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    expect(await screen.findByRole('status')).toHaveTextContent('No se pudo generar el PDF')

    vi.unstubAllGlobals()
  })
})
