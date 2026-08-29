import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/renderWithProviders'

import { LoginForm } from './LoginForm'

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
})
