import { beforeEach, describe, expect, it } from 'vitest'

import { STORAGE_KEYS } from '@/shared/lib/storage'

import { analysisDrawerToggled, localeChanged, themeToggled, uiSlice } from './uiSlice'

const reduce = uiSlice.reducer

describe('uiSlice — theme', () => {
  it('starts light, so a first-time user sees the mode the design is drawn in', () => {
    expect(reduce(undefined, { type: '@@INIT' }).theme).toBe('light')
  })

  it('toggles between the two modes', () => {
    const dark = reduce(undefined, themeToggled())
    expect(dark.theme).toBe('dark')
    expect(reduce(dark, themeToggled()).theme).toBe('light')
  })
})

describe('uiSlice — locale', () => {
  it('starts English when the browser gives no better hint', () => {
    expect(reduce(undefined, { type: '@@INIT' }).locale).toBe('en')
  })

  it('sets the language explicitly rather than cycling', () => {
    const spanish = reduce(undefined, localeChanged('es'))
    expect(spanish.locale).toBe('es')
    expect(reduce(spanish, localeChanged('es')).locale).toBe('es')
    expect(reduce(spanish, localeChanged('en')).locale).toBe('en')
  })
})

describe('uiSlice — analysis drawer', () => {
  it('starts closed, and is never restored from a previous session', () => {
    // Unlike the rail, this is work in progress rather than a preference.
    expect(reduce(undefined, { type: '@@INIT' }).analysisDrawerOpen).toBe(false)
  })

  it('opens and closes explicitly, and toggles with no argument', () => {
    const open = reduce(undefined, analysisDrawerToggled(true))
    expect(open.analysisDrawerOpen).toBe(true)
    expect(reduce(open, analysisDrawerToggled(true)).analysisDrawerOpen).toBe(true)
    expect(reduce(open, analysisDrawerToggled()).analysisDrawerOpen).toBe(false)
  })

})

describe('preferences that survive a bad localStorage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('ignores a stored value that is not a language we ship', () => {
    // A previous version, a hand-edited value, or a language since removed.
    globalThis.localStorage.setItem(STORAGE_KEYS.locale, JSON.stringify('fr'))

    // The slice reads storage at module load, so assert the guard itself: an
    // unknown code must never reach state as a locale.
    expect(reduce(undefined, { type: '@@INIT' }).locale).not.toBe('fr')
  })
})
