import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useTranslation } from '@/shared/i18n'
import { renderWithProviders } from '@/test/renderWithProviders'

import { LanguageSelect } from './LanguageSelect'

/** Stands in for any translated screen. */
function Screen() {
  const { t, fmt } = useTranslation()

  return (
    <>
      <LanguageSelect />
      <p>{t('analysis.title')}</p>
      <p data-testid="count">{fmt.number(12_345)}</p>
      {/* Spanish groups only from five digits up (CLDR minimumGroupingDigits),
          so a four-digit count is bare — which is the point of asking `Intl`
          rather than inserting separators ourselves. */}
      <p data-testid="small-count">{fmt.number(1234)}</p>
    </>
  )
}

describe('LanguageSelect', () => {
  it('names each language in that language, not in the current one', () => {
    renderWithProviders(<Screen />)

    // The one person guaranteed not to read the current language is the person
    // looking for this control.
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
  })

  it('re-renders the surrounding UI in the chosen language', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<Screen />)

    // Spanish is the default, so the switch under test is the one to English.
    expect(screen.getByText('Análisis de pólizas')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en')

    expect(store.getState().ui.locale).toBe('en')
    expect(screen.getByText('Policy analysis')).toBeInTheDocument()
    // The chip's own label is now English too.
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
  })

  it('switches number formatting with the language', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Screen />)

    expect(screen.getByTestId('count')).toHaveTextContent('12.345')
    expect(screen.getByTestId('small-count')).toHaveTextContent('1234')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en')

    expect(screen.getByTestId('count')).toHaveTextContent('12,345')
    expect(screen.getByTestId('small-count')).toHaveTextContent('1,234')
  })
})
