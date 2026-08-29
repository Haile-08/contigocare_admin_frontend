import { render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { makeStore } from '@/app/store'
import type { AppStore, RootState } from '@/app/store'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  /** Initial URL, for components that read route params or render links. */
  route?: string
}

export interface RenderWithProvidersResult extends RenderResult {
  store: AppStore
}

/**
 * Renders a component with a real store and router.
 *
 * Tests exercise the actual reducers and middleware rather than mocks, so they
 * fail when the wiring breaks — which is the part worth protecting.
 */
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, route = '/', ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const store = makeStore(preloadedState)

  const result = render(ui, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    ),
    ...options,
  })

  return { ...result, store }
}
