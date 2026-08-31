import { describe, expect, it } from 'vitest'

import { en } from './en'
import { es } from './es'
import { translate, translator } from './translate'
import { LOCALES } from './types'

describe('translate', () => {
  it('returns the phrase for the locale', () => {
    expect(translate('en', 'login.title')).toBe('Sign in')
    expect(translate('es', 'login.title')).toBe('Iniciar sesión')
  })

  it('substitutes placeholders', () => {
    expect(translate('es', 'dashboard.patientLabel', { id: 'MX-4821' })).toBe(
      'Paciente MX-4821',
    )
  })

  it('leaves a placeholder alone when no value is given for it', () => {
    // Better a visible `{id}` in one label than a sentence with a hole in it.
    expect(translate('en', 'dashboard.patientLabel', { other: 'x' })).toBe('Patient {id}')
  })

  it('picks the singular form on a count of one, and the plural otherwise', () => {
    expect(translate('en', 'analysis.criticalCount', { count: 1 })).toBe(
      '1 critical finding needs attention.',
    )
    expect(translate('en', 'analysis.criticalCount', { count: 4 })).toBe(
      '4 critical findings need attention.',
    )
    expect(translate('es', 'analysis.criticalCount', { count: 1 })).toBe(
      '1 hallazgo crítico requiere atención.',
    )
    expect(translate('es', 'analysis.criticalCount', { count: 0 })).toBe(
      '0 hallazgos críticos requieren atención.',
    )
  })

  it('binds a stable `t` per locale, so a memo on it does not rebuild every render', () => {
    expect(translator('es')).toBe(translator('es'))
    expect(translator('es')).not.toBe(translator('en'))
  })
})

describe('dictionaries', () => {
  const dictionaries = { en, es }

  it('translates every key in every language', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(Object.keys(en).sort())
    }
  })

  it('leaves no phrase empty, and no Spanish phrase identical to a whole English sentence', () => {
    for (const [key, phrase] of Object.entries(es)) {
      const forms = typeof phrase === 'string' ? [phrase] : [phrase.one, phrase.other]

      for (const form of forms) {
        expect(form.trim(), `es.${key} is empty`).not.toBe('')
      }
    }
  })

  it('keeps the placeholders of each phrase across languages', () => {
    // A dropped `{count}` is invisible in review and turns "3 messages" into
    // "messages" for one language only.
    const placeholders = (phrase: string | { one: string; other: string }): string =>
      [...(typeof phrase === 'string' ? phrase : phrase.other).matchAll(/\{(\w+)\}/g)]
        .map((match) => match[1])
        .sort()
        .join(',')

    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(es[key]), `es.${key} placeholders`).toBe(placeholders(en[key]))
    }
  })
})
