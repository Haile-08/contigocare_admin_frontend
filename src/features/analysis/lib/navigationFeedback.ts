import type { NavigationFeedback, NavigationSection, SectionFeedback } from '../model/navigation'
import { NAVIGATION_SECTIONS } from '../model/navigation'

/**
 * The reviewer's feedback on a navigation, as pure functions: which sections
 * there are to judge, the form's starting state, and what is posted.
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (isObject(value)) return Object.keys(value).length > 0
  if (typeof value === 'string') return value.trim() !== ''
  return value !== null && value !== undefined
}

/**
 * The sections this run's report actually printed, in report order.
 *
 * A run without a denial has no appeal package, and one whose notice was
 * already sent has no letter. Offering a flag for a section the report never
 * showed invites feedback about nothing.
 */
export function reviewableSections(result: Record<string, unknown> | null | undefined): NavigationSection[] {
  if (!result) return []
  const plan = isObject(result['action_plan']) ? result['action_plan'] : {}
  const roadmap = isObject(result['financial_roadmap']) ? result['financial_roadmap'] : {}

  const present: Record<NavigationSection, boolean> = {
    policy_extraction: hasContent(result['policy_extraction']),
    carrier_alerts: hasContent(result['carrier_alerts']),
    // The report prints the deadline table, the plan and the checklist whatever
    // the planner returned, so they can always be judged.
    deadlines: true,
    action_plan: true,
    docs_checklist: true,
    cost_projection: true,
    financial_roadmap: hasContent(roadmap['financial_summary']),
    adherence: hasContent(result['adherence']),
    appeal_pathway: hasContent(plan['appeal_pathway']),
    notification_letter: hasContent(result['notification_letter']),
    appeal_package: hasContent(result['appeal_package']),
  }
  return NAVIGATION_SECTIONS.filter((section) => present[section])
}

export type SectionDrafts = Partial<Record<NavigationSection, SectionFeedback>>

/** The form's section drafts, seeded from a verdict on record. */
export function initialSectionDrafts(existing: NavigationFeedback | null | undefined): SectionDrafts {
  if (!existing) return {}
  const drafts: SectionDrafts = {}
  for (const section of NAVIGATION_SECTIONS) {
    const stored = existing.sections[section]
    if (stored) drafts[section] = { flagged: stored.flagged, comment: stored.comment }
  }
  return drafts
}

/**
 * The sections as posted: trimmed, and only those the reviewer flagged or
 * commented on, among the sections this report has.
 */
export function toSectionPayload(drafts: SectionDrafts, sections: readonly NavigationSection[]): SectionDrafts {
  const payload: SectionDrafts = {}
  for (const section of sections) {
    const draft = drafts[section]
    if (!draft) continue
    const comment = draft.comment.trim()
    if (draft.flagged || comment) payload[section] = { flagged: draft.flagged, comment }
  }
  return payload
}

/** How many sections the reviewer flagged. */
export function flaggedCount(drafts: SectionDrafts, sections: readonly NavigationSection[]): number {
  return sections.filter((section) => drafts[section]?.flagged).length
}
