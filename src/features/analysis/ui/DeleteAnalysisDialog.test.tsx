import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { DeleteAnalysisDialog } from './DeleteAnalysisDialog'

/** Spanish is the default, so it is English that a test has to ask for. */
const englishUi = uiStateWith({ locale: 'en' })

const ANALYSIS_ID = '0f2b1c8e-0000-4000-8000-000000000001'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderDialog(patientAnalysisCount: number, onDeleted = vi.fn()) {
  renderWithProviders(
    <DeleteAnalysisDialog
      open
      analysisId={ANALYSIS_ID}
      patientId="PAC-2026-0020"
      patientAnalysisCount={patientAnalysisCount}
      onClose={vi.fn()}
      onDeleted={onDeleted}
    />,
    { preloadedState: { ui: englishUi } },
  )
  return { onDeleted }
}

/** The URL the mutation was sent to, from a `fetch` spy's first call. */
function requestedUrl(spy: ReturnType<typeof vi.spyOn>): string {
  const request = spy.mock.calls[0]?.[0] as Request
  return request.url
}

describe('DeleteAnalysisDialog', () => {
  it('deletes only this analysis unless the wider scope is chosen', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ patient_id: 'PAC-2026-0020', deleted_analyses: 1, deleted_feedback: 1 }),
      )

    const user = userEvent.setup()
    const { onDeleted } = renderDialog(4)

    await user.click(screen.getByRole('button', { name: 'Delete analysis' }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith({
        patient_id: 'PAC-2026-0020',
        deleted_analyses: 1,
        deleted_feedback: 1,
      })
    })

    const url = requestedUrl(fetchSpy)
    expect(url).toContain(`/insurance/analyses/${ANALYSIS_ID}`)
    expect(url).toContain('scope=run')
  })

  /**
   * The assertion that matters here. The wide scope erases records the operator
   * is not looking at, so it has to be something they asked for explicitly —
   * never a default the dialog opened on.
   */
  it('escalates to every analysis of the patient only when asked, and says how many', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ patient_id: 'PAC-2026-0020', deleted_analyses: 4, deleted_feedback: 2 }),
      )

    const user = userEvent.setup()
    renderDialog(4)

    await user.click(screen.getByRole('radio', { name: /All 4 analyses for this patient/ }))
    await user.click(screen.getByRole('button', { name: 'Delete 4 analyses' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledOnce()
    })
    expect(requestedUrl(fetchSpy)).toContain('scope=patient')
  })

  it('offers no scope choice when the patient has only this one analysis', () => {
    renderDialog(1)

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(
      screen.getByText('This is the only analysis on record for patient PAC-2026-0020.'),
    ).toBeInTheDocument()
  })

  it('keeps the dialog open and shows the server message when the erasure fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'Análisis no encontrado.' }, 404),
    )

    const user = userEvent.setup()
    const { onDeleted } = renderDialog(2)

    await user.click(screen.getByRole('button', { name: 'Delete analysis' }))

    expect(await screen.findByText('Análisis no encontrado.')).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
