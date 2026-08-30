import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { UiState } from '@/features/ui/model/uiSlice'
import { renderWithProviders } from '@/test/renderWithProviders'

import { LoginForm } from './LoginForm'

const spanishUi: UiState = {
  theme: 'light',
  locale: 'es',
  sidebarCollapsed: false,
  mobileNavOpen: false,
  opsRailOpen: true,
}

describe('LoginForm', () => {
  it('rejects an invalid email before touching the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()

    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'Secret123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('surfaces the API message when credentials are wrong', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Incorrect email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'nurse@contigo.care')
    await user.type(screen.getByLabelText('Password'), 'WrongPass1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password')

    // A failed login must leave the user signed out.
    await waitFor(() => {
      expect(store.getState().auth.token).toBeNull()
    })
  })

  it('stores credentials in the store on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'header.payload.signature',
          token_type: 'bearer',
          expires_at: '2099-01-01T00:00:00Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'nurse@contigo.care')
    await user.type(screen.getByLabelText('Password'), 'Secret123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(store.getState().auth.token).toBe('header.payload.signature')
    })
    expect(store.getState().auth.user?.email).toBe('nurse@contigo.care')
  })

  it('renders its labels and its validation in Spanish', async () => {
    const user = userEvent.setup()

    renderWithProviders(<LoginForm />, { preloadedState: { ui: spanishUi } })

    // The schema is built from `t`, so the message has to follow the labels.
    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-un-correo')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreto123!')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(
      await screen.findByText('Introduzca una dirección de correo válida'),
    ).toBeInTheDocument()
  })

  it('translates our own error messages but passes the server’s through', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'))

    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { preloadedState: { ui: spanishUi } })

    await user.type(screen.getByLabelText('Correo electrónico'), 'nurse@contigo.care')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreto123!')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    // A transport failure is our sentence, so it is translated.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo contactar con el servidor',
    )
  })
})
