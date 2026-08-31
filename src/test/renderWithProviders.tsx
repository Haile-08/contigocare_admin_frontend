import { render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { Localized } from '@/app/providers/Localized'
import { makeStore } from '@/app/store'
import type { AppStore, RootState } from '@/app/store'
import { uiSlice } from '@/features/ui/model/uiSlice'
import type { UiState } from '@/features/ui/model/uiSlice'

/**
 * A complete `ui` slice with a few fields changed — Redux wants the whole slice
 * in `preloadedState`, and a test that only cares about the language should not
 * have to restate the rest of the chrome.
 */
export function uiStateWith(overrides: Partial<UiState>): UiState {
  return { ...uiSlice.getInitialState(), ...overrides }
}

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
        {/* The production bridge, not a stand-in: a test that dispatches
            `localeChanged` re-renders exactly as the app does. */}
        <Localized>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </Localized>
      </Provider>
    ),
    ...options,
  })

  return { ...result, store }
}
