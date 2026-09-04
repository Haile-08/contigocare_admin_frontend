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
    tipo_poliza: found('Colectivo'),
    moneda: found('MXN'),
    vigencia_inicio: found('30/05/2025'),
    vigencia_fin: found('30/05/2026'),
    registro_cnsf: found('CNSF-S0025-0123-2019'),
  },
  estructura_financiera: {
    deducible: found('$19,500.00'),
    tipo_deducible: found('Única por padecimiento'),
    coaseguro_porcentaje: found('10%'),
    tope_coaseguro: found('$68,000.00'),
    suma_asegurada: found('$2,120,000.00'),
    tope_honorarios_medicos: found('$210,000.00'),
  },
  alcance_cobertura: {
    biologicos_cubiertos: { valor: null, confianza: 'no_encontrado' },
    modelo_red: found('Red obligatoria'),
  },
  exclusiones_limitaciones: { productos_dermatologicos_excluidos: found('Sí') },
  preexistencias_continuidad: { preexistencias_excluidas: found('Sí') },
  proceso_siniestros: { plazo_aviso_siniestro_dias: found('5') },
  mecanismos_disputa: { clausula_renovacion: found('Renovación anual') },
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
  return renderWithProviders(<PolicyExtractionCard analysis={analysis} meta={meta} />, {
    preloadedState: { ui: uiStateWith({ locale: 'es' }) },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PolicyExtractionCard', () => {
  it('states the extracted terms, grouped as the report prints them', () => {
    renderCard()

    for (const heading of [
      'Identificación y administrativo',
      'Estructura financiera',
      'Alcance de la cobertura',
      'Exclusiones y limitaciones',
      'Preexistencias y continuidad',
      'Proceso de siniestros',
      'Disputa y regulación',
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument()
    }

    expect(screen.getByText('$19,500.00')).toBeInTheDocument()
    expect(screen.getByText('Única por padecimiento')).toBeInTheDocument()
    expect(screen.getByText('$68,000.00')).toBeInTheDocument()
    expect(screen.getByText('30/05/2025 - 30/05/2026')).toBeInTheDocument()
  })

  it('carries the run’s urgency, so a forwarded table is not anonymous', () => {
    renderCard()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
  })

  it('says a field was not found rather than showing an empty cell', () => {
    renderCard()

    const row = screen.getByText('Biológicos cubiertos').closest('div')
    expect(within(row as HTMLElement).getByText('No encontrado')).toBeInTheDocument()
  })

  it('shows a derived row as a value, not as a field the agent failed to find', () => {
    renderCard()

    // The policy period and the extraction score have no `Campo` behind them.
    // Reading "no field" as "not found" would report a gap that is not there.
    const row = screen.getByText('Periodo de póliza').closest('div')
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
