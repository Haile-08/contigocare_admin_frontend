import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders, uiStateWith } from '@/test/renderWithProviders'

import { ResetPasswordForm } from './ResetPasswordForm'

/** Spanish is the default, so it is English that a test has to ask for. */
const englishUi = uiStateWith({ locale: 'en' })

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const UPDATED = {
  request_id: '00000000-0000-4000-8000-000000000000',
  detail: 'Su contraseña se actualizó.',
}

describe('ResetPasswordForm', () => {
  it('enforces the password policy before touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()

    renderWithProviders(<ResetPasswordForm token="tok" onDone={vi.fn()} />, {
      preloadedState: { ui: englishUi },
    })

    await user.type(screen.getByLabelText('New password'), 'short1')
    await user.type(screen.getByLabelText('Confirm new password'), 'short1')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('catches a mistyped confirmation', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()

    renderWithProviders(<ResetPasswordForm token="tok" onDone={vi.fn()} />, {
      preloadedState: { ui: englishUi },
    })

    await user.type(screen.getByLabelText('New password'), 'CorrectHorse42')
    await user.type(screen.getByLabelText('Confirm new password'), 'CorrectHorse43')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends the token with the new password', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(UPDATED))
    const onDone = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<ResetPasswordForm token="link-token" onDone={onDone} />, {
      preloadedState: { ui: englishUi },
    })

    await user.type(screen.getByLabelText('New password'), 'CorrectHorse42')
    await user.type(screen.getByLabelText('Confirm new password'), 'CorrectHorse42')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })

    const request = fetchSpy.mock.calls[0]?.[0] as Request
    const body = (await request.clone().json()) as Record<string, unknown>
    expect(body).toEqual({ token: 'link-token', new_password: 'CorrectHorse42' })
  })

  /**
   * The security-relevant assertion in this file.
   *
   * A completed reset must leave the operator signed out. If this ever holds a
   * token, control of a mailbox has become control of an account and the TOTP
   * factor has quietly stopped being required.
   */
  it('does not sign the user in on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(UPDATED))

    const user = userEvent.setup()
    const { store } = renderWithProviders(
      <ResetPasswordForm token="link-token" onDone={vi.fn()} />,
      { preloadedState: { ui: englishUi } },
    )

    await user.type(screen.getByLabelText('New password'), 'CorrectHorse42')
    await user.type(screen.getByLabelText('Confirm new password'), 'CorrectHorse42')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() => {
      expect(store.getState().auth.token).toBeNull()
    })

    expect(store.getState().auth.mfaToken).toBeNull()
    expect(store.getState().auth.admin).toBeNull()
    expect(store.getState().auth.stage).toBe('credentials')
  })

  it('shows the server’s reason for a dead link', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'El enlace no es válido o ya caducó. Solicite uno nuevo.' }, 400),
    )

    const onDone = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<ResetPasswordForm token="stale" onDone={onDone} />, {
      preloadedState: { ui: englishUi },
    })

    await user.type(screen.getByLabelText('New password'), 'CorrectHorse42')
    await user.type(screen.getByLabelText('Confirm new password'), 'CorrectHorse42')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido')
    expect(onDone).not.toHaveBeenCalled()
  })
})
