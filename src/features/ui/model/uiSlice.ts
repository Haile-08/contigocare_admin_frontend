import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { DEFAULT_LOCALE, LOCALES, isLocale } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'
import { STORAGE_KEYS, createStorage } from '@/shared/lib/storage'

export type Theme = 'light' | 'dark'

export interface UiState {
  theme: Theme
  /** The console's language. Chrome, like the theme — a preference, not data. */
  locale: Locale
  /** The desktop nav rail, collapsed to icons only. */
  sidebarCollapsed: boolean
  /** The mobile drawer — separate state, because it is a different control. */
  mobileNavOpen: boolean
  /** The dashboard's right-hand ops rail. Chrome, like the rail, so it persists. */
  opsRailOpen: boolean
}

const themeStorage = createStorage<Theme | null>(STORAGE_KEYS.theme, null)
const localeStorage = createStorage<Locale | null>(STORAGE_KEYS.locale, null)
const sidebarStorage = createStorage<boolean>(STORAGE_KEYS.sidebar, false)
const opsRailStorage = createStorage<boolean>(STORAGE_KEYS.opsRail, true)

/**
 * Light is the console's default — it is the mode the design is drawn in, so a
 * first-time user sees it regardless of their OS setting. Dark is reachable
 * from the topbar toggle, and once chosen it is what's honoured from then on.
 */
function preferredTheme(): Theme {
  const stored = themeStorage.read()
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

/**
 * Language, unlike theme, *does* follow the browser on a first visit: someone
 * whose machine is set to Spanish is far more likely to want Spanish than to
 * want our default, and the cost of guessing wrong is one click in the topbar.
 * An explicit choice, once made, always wins.
 */
function preferredLocale(): Locale {
  const stored = localeStorage.read()
  if (isLocale(stored)) return stored

  for (const tag of globalThis.navigator?.languages ?? []) {
    const base = tag.toLowerCase().split('-')[0]
    const match = LOCALES.find((locale) => locale === base)
    if (match) return match
  }

  return DEFAULT_LOCALE
}

const initialState: UiState = {
  theme: preferredTheme(),
  locale: preferredLocale(),
  sidebarCollapsed: sidebarStorage.read() === true,
  mobileNavOpen: false,
  opsRailOpen: opsRailStorage.read() !== false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeToggled: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    /** Explicit rather than a toggle: with more than two languages, cycling stops making sense. */
    localeChanged: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload
    },
    sidebarToggled: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    mobileNavToggled: (state, action: PayloadAction<boolean | undefined>) => {
      state.mobileNavOpen = action.payload ?? !state.mobileNavOpen
    },
    opsRailToggled: (state, action: PayloadAction<boolean | undefined>) => {
      state.opsRailOpen = action.payload ?? !state.opsRailOpen
    },
  },
  selectors: {
    selectTheme: (state) => state.theme,
    selectLocale: (state) => state.locale,
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
    selectMobileNavOpen: (state) => state.mobileNavOpen,
    selectOpsRailOpen: (state) => state.opsRailOpen,
  },
})

export const {
  themeToggled,
  localeChanged,
  sidebarToggled,
  mobileNavToggled,
  opsRailToggled,
} = uiSlice.actions

export const {
  selectTheme,
  selectLocale,
  selectSidebarCollapsed,
  selectMobileNavOpen,
  selectOpsRailOpen,
} = uiSlice.selectors

export const uiPersistence = { themeStorage, localeStorage, sidebarStorage, opsRailStorage }
