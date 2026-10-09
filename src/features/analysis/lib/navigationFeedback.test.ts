import { describe, expect, it } from 'vitest'

import { SUMMARY } from './innovadermSummary.fixture'
import { flaggedCount, initialSectionDrafts, reviewableSections, toSectionPayload } from './navigationFeedback'

describe('reviewableSections', () => {
  it('offers only the sections the report printed, in report order', () => {
    const sections = reviewableSections({ ...SUMMARY, appeal_package: null })

    expect(sections[0]).toBe('policy_extraction')
    expect(sections).toContain('action_plan')
    expect(sections).not.toContain('appeal_package')
    expect(sections.indexOf('deadlines')).toBeLessThan(sections.indexOf('action_plan'))
  })

  it('leaves out an appeal and a letter the run never produced', () => {
    const sections = reviewableSections({ action_plan: { summary: 'x' }, notification_letter: null })

    expect(sections).toEqual(['deadlines', 'action_plan', 'docs_checklist', 'cost_projection'])
  })

  it('has nothing to judge without a result', () => {
    expect(reviewableSections(null)).toEqual([])
  })
})

describe('toSectionPayload', () => {
  it('posts only flagged or commented sections, trimmed', () => {
    const payload = toSectionPayload(
      {
        action_plan: { flagged: true, comment: '  El paso 2 no aplica  ' },
        deadlines: { flagged: false, comment: '   ' },
        adherence: { flagged: false, comment: 'Revisar dosis de carga' },
      },
      ['deadlines', 'action_plan', 'adherence'],
    )

    expect(payload).toEqual({
      action_plan: { flagged: true, comment: 'El paso 2 no aplica' },
      adherence: { flagged: false, comment: 'Revisar dosis de carga' },
    })
  })

  it('drops a draft for a section this report does not have', () => {
    expect(toSectionPayload({ appeal_package: { flagged: true, comment: '' } }, ['action_plan'])).toEqual({})
  })
})

describe('initialSectionDrafts', () => {
  it('starts from the verdict on record', () => {
    const drafts = initialSectionDrafts({
      verdict: 'partially_correct',
      sections: { action_plan: { flagged: true, comment: 'x' }, unknown: { flagged: true, comment: '' } },
      notes: '',
      created_at: '2026-09-14T10:00:00Z',
    })

    expect(drafts).toEqual({ action_plan: { flagged: true, comment: 'x' } })
    expect(flaggedCount(drafts, ['action_plan', 'deadlines'])).toBe(1)
  })
})
