import { isAnyOf } from '@reduxjs/toolkit'

import type { AppStartListening } from '@/app/store/listenerMiddleware'
import { LOCALE_TAGS } from '@/shared/i18n'
import type { Locale } from '@/shared/i18n'

import {
  localeChanged,
  opsRailToggled,
  sidebarToggled,
  themeToggled,
  uiPersistence,
} from './uiSlice'

/**
 * Persists chrome preferences, and writes the theme and language onto `<html>`.
 *
 * The DOM writes live here rather than in an effect inside a component: the
 * attributes are what the whole stylesheet (and the browser's own hyphenation,
 * spell-check and voice selection) key off, so they have to be set once per
 * change, not once per mount of whichever component happened to own them.
 */
export function registerUiListeners(startListening: AppStartListening): void {
  startListening({
    matcher: isAnyOf(themeToggled, localeChanged, sidebarToggled, opsRailToggled),
    effect: (_action, listenerApi) => {
      const { theme, locale, sidebarCollapsed, opsRailOpen } = listenerApi.getState().ui

      uiPersistence.themeStorage.write(theme)
      uiPersistence.localeStorage.write(locale)
      uiPersistence.sidebarStorage.write(sidebarCollapsed)
      uiPersistence.opsRailStorage.write(opsRailOpen)

      applyTheme(theme)
      applyLocale(locale)
    },
  })
}

/** Also called once at startup, so the first paint is already in the right mode. */
export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.dataset['theme'] = theme
}

/**
 * `<html lang>` is not decoration: it picks the screen reader's voice and the
 * browser's hyphenation and spell-check dictionaries. The BCP-47 tag goes on
 * the element; the short code is what we store.
 */
export function applyLocale(locale: Locale): void {
  document.documentElement.lang = LOCALE_TAGS[locale]
}
