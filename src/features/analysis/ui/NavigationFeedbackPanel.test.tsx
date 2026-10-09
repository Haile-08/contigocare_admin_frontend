import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { SUMMARY } from '../lib/innovadermSummary.fixture'
import { navigationResponseSchema } from '../model/navigation'
import { NavigationFeedbackPanel } from './NavigationFeedbackPanel'

function runWith(overrides: Record<string, unknown> = {}) {
  return navigationResponseSchema.parse({
    navigation_id: 'nav-1',
    analysis_id: 'an-1',
    patient_id: 'PAC-2026-0021',
    status: 'succeeded',
    created_at: '2026-09-14T10:00:00Z',
    result: SUMMARY,
    ...overrides,
  })
}

function renderPanel(run = runWith()) {
  return renderWithProviders(<NavigationFeedbackPanel run={run} />, {
    preloadedState: { ui: uiStateWith({ locale: 'en' }) },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NavigationFeedbackPanel', () => {
  it('posts the verdict with only the sections the reviewer touched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    const user = userEvent.setup()
    renderPanel()

    const submit = screen.getByRole('button', { name: 'Submit review' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Partly correct' }))
    await user.click(screen.getByRole('button', { name: 'Mark 1 & 5. Summary and action plan as wrong' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Comment on 1 & 5. Summary and action plan' }),
      'Step 2 does not apply',
    )
    expect(screen.getByText('1 section flagged')).toBeInTheDocument()

    await user.click(submit)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
    const request = fetchSpy.mock.calls[0]?.[0] as Request
    expect(request.url).toContain('/insurance/navigations/nav-1/feedback')
    expect(request.method).toBe('POST')
    expect(await request.json()).toEqual({
      verdict: 'partially_correct',
      sections: { action_plan: { flagged: true, comment: 'Step 2 does not apply' } },
      notes: '',
    })
    expect(await screen.findByText('Review recorded. Thank you.')).toBeInTheDocument()
  })

  it('loads a verdict on record so it can be revised', () => {
    renderPanel(
      runWith({
        feedback: {
          verdict: 'incorrect',
          sections: { deadlines: { flagged: true, comment: 'Wrong notice date' } },
          notes: 'Recheck',
          created_at: '2026-09-14T11:00:00Z',
        },
      }),
    )

    expect(screen.getByText('Your review of this navigation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Incorrect' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: 'Comment on 4. Deadlines' })).toHaveValue('Wrong notice date')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })
})
