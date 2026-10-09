import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { LoginForm } from './LoginForm'

/** Spanish is the default, so it is English that a test has to ask for. */
const englishUi = uiStateWith({ locale: 'en' })

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('LoginForm', () => {
  it('rejects an invalid email before touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()

    renderWithProviders(<LoginForm />, { preloadedState: { ui: englishUi } })

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'Secret123!')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('surfaces the API message when credentials are wrong', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'Correo o contraseña incorrectos.' }, 401),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<LoginForm />, { preloadedState: { ui: englishUi } })

    await user.type(screen.getByLabelText('Email'), 'ops@karai.health')
    await user.type(screen.getByLabelText('Password'), 'WrongPass1!')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Correo o contraseña incorrectos.',
    )

    await waitFor(() => {
      expect(store.getState().auth.token).toBeNull()
    })
  })

  /**
   * The security-relevant assertion in this file.
   *
   * A correct password must not produce a session. If this test ever passes
   * with a non-null `auth.token`, the second factor has become optional — which
   * is the exact failure a two-step login exists to prevent, and it would be
   * invisible in the UI because the login screen would simply move on.
   */
  it('does not sign the user in on a correct password alone', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        mfa_token: 'challenge.token.value',
        expires_at: '2099-01-01T00:00:00Z',
        enrollment_required: false,
      }),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<LoginForm />, { preloadedState: { ui: englishUi } })

    await user.type(screen.getByLabelText('Email'), 'ops@karai.health')
    await user.type(screen.getByLabelText('Password'), 'Secret123!')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(store.getState().auth.mfaToken).toBe('challenge.token.value')
    })

    expect(store.getState().auth.token).toBeNull()
    expect(store.getState().auth.admin).toBeNull()
    expect(store.getState().auth.stage).toBe('verify')
  })

  it('sends a first-time account to enrolment rather than the code prompt', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        mfa_token: 'challenge.token.value',
        expires_at: '2099-01-01T00:00:00Z',
        enrollment_required: true,
      }),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<LoginForm />, { preloadedState: { ui: englishUi } })

    await user.type(screen.getByLabelText('Email'), 'ops@karai.health')
    await user.type(screen.getByLabelText('Password'), 'Secret123!')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(store.getState().auth.stage).toBe('enroll')
    })
  })

  it('renders its labels and its validation in Spanish', async () => {
    const user = userEvent.setup()

    renderWithProviders(<LoginForm />)

    // The schema is built from `t`, so the message has to follow the labels.
    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-un-correo')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreto123!')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(
      await screen.findByText('Ingrese un correo electrónico válido.'),
    ).toBeInTheDocument()
  })

  it('translates our own error messages but passes the server’s through', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'))

    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'ops@karai.health')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreto123!')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    // A transport failure is our sentence, so it is translated.
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo contactar al servidor')
  })
})
