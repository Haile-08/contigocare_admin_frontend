import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/renderWithProviders'

import { ForgotPasswordForm } from './ForgotPasswordForm'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const ACCEPTED = {
  request_id: '00000000-0000-4000-8000-000000000000',
  detail: 'Si existe una cuenta con ese correo, le enviamos un enlace para restablecer la contraseña.',
}

describe('ForgotPasswordForm', () => {
  it('rejects an invalid email before touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()

    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  /**
   * The wording matters as much as the behaviour here.
   *
   * The API answers 202 for an address that has no account, precisely so this
   * endpoint cannot be used to ask who works here. A confirmation that said
   * "sent" would hand that back — the screen has to stay conditional, because
   * the client genuinely does not know.
   */
  it('confirms conditionally, without claiming the account exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(ACCEPTED, 202))

    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'ops@contigo.care')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))

    const confirmation = await screen.findByText(/If an account exists for ops@contigo\.care/)
    expect(confirmation).toBeInTheDocument()
  })

  /**
   * A reset request must never produce a session. If this ever holds a token,
   * the email step has become a way in on its own — which is the whole thing
   * the second factor is there to prevent.
   */
  it('never signs anyone in', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(ACCEPTED, 202))

    const user = userEvent.setup()
    const { store } = renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'ops@contigo.care')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))

    await screen.findByText(/If an account exists/)

    expect(store.getState().auth.token).toBeNull()
    expect(store.getState().auth.mfaToken).toBeNull()
    expect(store.getState().auth.admin).toBeNull()
  })

  it('returns to the credentials stage from the back link', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<ForgotPasswordForm />, {
      preloadedState: {
        auth: {
          admin: null,
          token: null,
          expiresAt: null,
          mfaToken: null,
          stage: 'forgot',
          enrollmentRequired: false,
          recoveryCodes: null,
          bootstrapping: false,
          logoutReason: null,
        },
      },
    })

    await user.click(screen.getByRole('button', { name: 'Back to sign in' }))

    await waitFor(() => {
      expect(store.getState().auth.stage).toBe('credentials')
    })
  })

  it('shows a rate-limit refusal rather than pretending the mail went out', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'Demasiadas solicitudes.' }, 429),
    )

    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'ops@contigo.care')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiadas solicitudes.')
    expect(screen.queryByText(/If an account exists/)).not.toBeInTheDocument()
  })
})
