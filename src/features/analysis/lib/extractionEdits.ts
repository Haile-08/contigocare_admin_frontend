import type { ExtractionGroup, ExtractionRow } from './policyExtraction'
import { PLACEHOLDER } from './runSummary'
import type { RunSummaryRow } from './runSummary'

/**
 * The reviewer's corrections to the extraction, applied on the way to the PDF.
 *
 * An OCR pass that reads `$19,500.00` as `$19.500,00`, a plan name split across
 * a page break, a policy number with a stray character — the operator can see
 * the right value in the document and has, until now, had no way to put it in
 * the file that leaves the building. This is that: an overlay on top of the
 * built groups, keyed by the row it corrects.
 *
 * It is an **overlay** and not a mutation of `Analisis`, deliberately. What the
 * agent said is the record: it is what the reviewer's verdict is a verdict
 * *about*, what `evals/build_golden_set.py` scores a prompt version against,
 * and what the confidence marker and the evidence quote describe. Editing the
 * analysis in place would quietly rewrite the answer sheet — the next run would
 * be measured against a value a human typed, and the eval loop would report an
 * accuracy it did not earn. So the agent's value survives every edit, and a
 * corrected row carries both: the value that goes out, and the value that was
 * extracted.
 *
 * Corrections live for as long as the screen does. Nothing here is persisted,
 * because nothing here has been reviewed by anyone but the person typing it —
 * a value good enough to hand a broker once is not thereby a value the console
 * should serve back as the analysis result.
 *
 * Everything in this module is pure. The state lives in the component.
 */

/** Raw draft text, keyed by `editKey` — trimmed only when applied, so a space
 *  typed mid-word does not vanish from under the cursor. */
export type ExtractionEdits = Record<string, string>

/** `financial.deducible` — the row's address on screen, not its schema path. */
export function editKey(groupKey: string, rowKey: string): string {
  return `${groupKey}.${rowKey}`
}

/**
 * The rows the console computed rather than read out of the contract.
 *
 * The policy period is derived from the two coverage dates and follows them
 * (see `withDerivedPeriod`). The extraction score and the extraction date are
 * facts about the run: a score that says how much of the document was read, and
 * the day it was read. A reviewer who could type over those could hand a broker
 * a page claiming a 97% extraction that never happened — which is a claim about
 * the tool, not about the policy, and not theirs to make.
 */
const DERIVED_ROWS = new Set([
  'identification.periodo',
  'identification.confianza',
  'identification.fechaExtraccion',
])

/** Whether a reviewer may type over this row. */
export function isEditable(groupKey: string, rowKey: string): boolean {
  return !DERIVED_ROWS.has(editKey(groupKey, rowKey))
}

/**
 * A draft as the table states it.
 *
 * An emptied field becomes the placeholder rather than a blank cell, so
 * clearing a value the agent invented says the same thing as a value it never
 * found — "the document does not state this" — instead of leaving a gap the
 * reader has to interpret.
 */
function normalise(draft: string): string {
  return draft.trim() || PLACEHOLDER
}

export function setEdit(
  edits: ExtractionEdits,
  groupKey: string,
  rowKey: string,
  draft: string,
): ExtractionEdits {
  return { ...edits, [editKey(groupKey, rowKey)]: draft }
}

export function clearEdit(
  edits: ExtractionEdits,
  groupKey: string,
  rowKey: string,
): ExtractionEdits {
  const next = { ...edits }
  delete next[editKey(groupKey, rowKey)]
  return next
}

/** The two coverage dates the policy period is printed from. */
const PERIOD_SOURCES = ['vigencia_inicio', 'vigencia_fin']

/**
 * The policy period, recomputed when a coverage date was corrected.
 *
 * `30/05/2025 - 30/05/2026` in the period row and a corrected `30/06/2025` two
 * rows above it is a document that contradicts itself about when the contract
 * started, and the reader has no way to tell which line to believe. Mirrors
 * `policyPeriod` exactly, on the corrected values.
 */
function withDerivedPeriod(rows: readonly ExtractionRow[]): ExtractionRow[] {
  const touched = rows.some(
    (row) => PERIOD_SOURCES.includes(row.key) && row.original !== undefined,
  )
  if (!touched) return [...rows]

  const stated = (key: string): string => {
    const value = rows.find((row) => row.key === key)?.value
    return value && value !== PLACEHOLDER ? value : ''
  }

  const start = stated('vigencia_inicio')
  const end = stated('vigencia_fin')
  const period = start && end ? `${start} - ${end}` : start || end || PLACEHOLDER

  return rows.map((row) =>
    row.key === 'periodo' && row.value !== period
      ? { ...row, value: period, original: row.value }
      : row,
  )
}

/**
 * The extraction as it will be printed, with corrected rows carrying the value
 * they replaced.
 *
 * A draft that normalises back to the agent's own value is not a correction —
 * a reviewer who selects a value, retypes it identically and moves on has
 * changed nothing, and marking the row would put an asterisk in the broker's
 * copy against a number nobody touched.
 */
export function applyEdits(
  groups: readonly ExtractionGroup[],
  edits: ExtractionEdits,
): ExtractionGroup[] {
  return groups.map((group) => {
    const rows = group.rows.map((row): ExtractionRow => {
      const draft = edits[editKey(group.key, row.key)]
      if (draft === undefined || !isEditable(group.key, row.key)) return row

      const value = normalise(draft)
      if (value === row.value) return row

      return { ...row, value, original: row.value }
    })

    return { ...group, rows: withDerivedPeriod(rows) }
  })
}

/**
 * The identity band, following the one row of it that is also an extracted term.
 *
 * The insurer in the band and the insurer in the identification group are the
 * same fact printed twice, and a document whose letterhead disagrees with its
 * own table about who wrote the policy is worse than one that states it once.
 * The other four are the run's identity — which patient, which run, when, how
 * urgent — and are not editable anywhere: they describe what the console did,
 * not what the contract says, and a run id a human can retype is a run id
 * nobody can look up.
 */
export function applyHeaderEdits(
  header: readonly RunSummaryRow[],
  edits: ExtractionEdits,
): RunSummaryRow[] {
  const draft = edits[editKey('identification', 'aseguradora')]
  if (draft === undefined) return [...header]

  const value = normalise(draft)
  return header.map((row) => (row.key === 'insurer' ? { ...row, value } : row))
}

/** How many rows the reviewer actually changed, over applied groups. */
export function countEdits(groups: readonly ExtractionGroup[]): number {
  return groups.reduce(
    (total, group) => total + group.rows.filter((row) => row.original !== undefined).length,
    0,
  )
}
