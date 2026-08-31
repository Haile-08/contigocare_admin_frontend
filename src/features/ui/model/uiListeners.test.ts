import { beforeEach, describe, expect, it } from 'vitest'

import { makeStore } from '@/app/store'
import { STORAGE_KEYS } from '@/shared/lib/storage'

import { localeChanged, themeToggled } from './uiSlice'

describe('ui listeners', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('lang')
  })

  it('writes the theme onto <html>, which is what the stylesheet keys off', () => {
    const store = makeStore()

    store.dispatch(themeToggled())
    expect(document.documentElement.dataset['theme']).toBe('light')

    store.dispatch(themeToggled())
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('writes the BCP-47 tag onto <html lang>, not the short code', () => {
    // `lang` picks the screen reader's voice and the browser's hyphenation.
    const store = makeStore()

    store.dispatch(localeChanged('es'))
    expect(document.documentElement.lang).toBe('es-ES')

    store.dispatch(localeChanged('en'))
    expect(document.documentElement.lang).toBe('en-US')
  })

  it('persists both preferences, so a reload comes back the way it was left', () => {
    const store = makeStore()

    store.dispatch(themeToggled())
    store.dispatch(localeChanged('en'))

    expect(globalThis.localStorage.getItem(STORAGE_KEYS.theme)).toBe('"light"')
    expect(globalThis.localStorage.getItem(STORAGE_KEYS.locale)).toBe('"en"')
  })
})
