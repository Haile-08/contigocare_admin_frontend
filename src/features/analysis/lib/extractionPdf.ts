import { translator } from '@/shared/i18n'
import {
  CONTENT_WIDTH,
  FOOTER_BASELINE,
  MARGIN,
  PAGE_HEIGHT,
  PdfBuilder,
  toWinAnsi,
  truncate,
  wrapText,
} from '@/shared/lib/pdf'

import { countEdits } from './extractionEdits'
import type { ExtractionGroup } from './policyExtraction'
import { PLACEHOLDER } from './runSummary'
import type { RunSummaryRow } from './runSummary'

/**
 * The export is Spanish regardless of the console's language.
 *
 * The reader of this file is not the operator who pressed the button. It is a
 * Mexican broker or an insurer's case handler reading policy terms that are
 * themselves Spanish — `deducible`, `tope de coaseguro`, `vía de cobertura` —
 * next to labels that would otherwise be English because an admin happened to
 * have the console in English that morning. The document's language is a
 * property of who receives it, not of who generated it, so it is fixed here
 * rather than taken from the UI locale.
 */
const t = translator('es')

/**
 * Two columns, because the content is thirty-five short label/value pairs.
 *
 * Set full width they leave two thirds of an A4 page empty and push the last
 * group onto a second sheet; set in two columns the whole extraction is one
 * page the reader takes in at once, which is the difference between a document
 * that gets read in a meeting and one that gets filed.
 */
const COLUMN_GAP = 26
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2

/** Air between one group and the next, inside a column. */
const SECTION_GAP = 20

/** The line content may not flow past, leaving the footer band its room. */
const BODY_BOTTOM = PAGE_HEIGHT - 74

/** The footer note's line spacing, at 6.8pt. */
const NOTE_LEADING = 8.4

/** Where a column starts on a continuation page, under the running header. */
const CONTINUED_TOP = 82

/**
 * The intro is set narrower than the measure it sits on.
 *
 * A paragraph of prose the full width of an A4 page runs to over a hundred
 * characters a line, which is past the point where the eye reliably finds the
 * start of the next one. The table below it wants the width; this does not.
 */
const INTRO_WIDTH = CONTENT_WIDTH * 0.74

/** The identity band: five facts, three to a row. */
const BAND_COLUMNS = 3
const BAND_ROW_HEIGHT = 27

/**
 * Who and what this document is about, as a band rather than a list.
 *
 * These five facts were five full-width rows of the same table as the policy
 * terms, which made the run's identity look like more extracted data. They are
 * not: they are the letterhead. Set as small captioned cells between two rules
 * they read as one block, and they take a fifth of the vertical space.
 */
function identityBand(pdf: PdfBuilder, header: readonly RunSummaryRow[]): void {
  const top = pdf.y
  pdf.drawRule(MARGIN, top, CONTENT_WIDTH, 0.62)

  const cellWidth = CONTENT_WIDTH / BAND_COLUMNS
  const inner = cellWidth - 14

  header.forEach((row, index) => {
    const x = MARGIN + (index % BAND_COLUMNS) * cellWidth
    const y = top + Math.floor(index / BAND_COLUMNS) * BAND_ROW_HEIGHT

    pdf.drawText(truncate(t(row.label).toUpperCase(), 6.6, inner, 0.7), x, y + 13, {
      size: 6.6,
      font: 'bold',
      grey: 0.52,
      tracking: 0.7,
    })

    // The value is cut rather than wrapped because the cell is a fixed box in a
    // grid. Every one of these five is also stated in full elsewhere — the
    // insurer in the contract group, the run id in the file name — so a cut
    // here costs the reader nothing.
    pdf.drawText(truncate(row.value, 9.5, inner), x, y + 24.5, {
      size: 9.5,
      font: 'bold',
      grey: 0.1,
    })
  })

  const rows = Math.ceil(header.length / BAND_COLUMNS)
  pdf.moveTo(top + rows * BAND_ROW_HEIGHT + 4)
  pdf.drawRule(MARGIN, pdf.y, CONTENT_WIDTH, 0.62)
}

/**
 * The mark against a value a reviewer typed rather than the agent extracted.
 *
 * On the label rather than the value, so it survives the value being set flush
 * right and cannot be mistaken for part of a figure — `$68,000.00 *` reads like
 * a footnote on an amount, `Tope de coaseguro *` reads like a footnote on a
 * row, which is what it is.
 */
const EDITED_MARK = ' *'

/** One group of policy terms: a tracked heading, a rule, and its rows. */
function section(pdf: PdfBuilder, group: ExtractionGroup): void {
  pdf.text(t(group.title).toUpperCase(), {
    size: 7.6,
    font: 'bold',
    grey: 0.35,
    tracking: 1.1,
    leading: 10,
  })
  pdf.space(1)
  pdf.rule(0.6, 0.7)
  pdf.space(1)

  group.rows.forEach((row, index) => {
    // A field the analysis did not find is set light and unbolded, so a page of
    // values does not read as though the policy stated an em dash. The intro
    // says what the dash means; this makes it look like an absence.
    const missing = row.value === PLACEHOLDER
    const edited = row.original !== undefined

    pdf.row(edited ? `${t(row.label)}${EDITED_MARK}` : t(row.label), row.value, {
      size: 8.6,
      labelRatio: 0.56,
      valueFont: missing ? 'regular' : 'bold',
      valueGrey: missing ? 0.6 : 0.1,
      divider: index < group.rows.length - 1,
    })
  })
}

/** The stacked height of a run of sections, gaps included. */
function stackHeight(heights: readonly number[], gap: number): number {
  return heights.reduce((sum, height) => sum + height, 0) + gap * Math.max(0, heights.length - 1)
}

/**
 * Where to break the sections so the two columns come out level.
 *
 * Filling the first column greedily and letting the rest fall into the second
 * puts five groups on the left and one on the right, which looks like a
 * rendering fault rather than a layout. This picks the split that minimises the
 * taller column instead. If no split fits — more content than two columns hold
 * — it returns the section count, which forces nothing and leaves the flow's
 * own overflow handling to carry the rest onto the next page.
 */
export function balancedSplit(heights: readonly number[], gap: number, limit: number): number {
  let best = heights.length
  let bestScore = Number.POSITIVE_INFINITY

  for (let index = 1; index < heights.length; index += 1) {
    const first = stackHeight(heights.slice(0, index), gap)
    const second = stackHeight(heights.slice(index), gap)

    if (first > limit || second > limit) continue

    const score = Math.max(first, second)
    if (score < bestScore) {
      bestScore = score
      best = index
    }
  }

  return best
}

/**
 * The extraction, as a file that leaves the building.
 *
 * The console's own reader has the screen; this is for the one who does not —
 * the broker, the insurer's case handler, the coordinator reading it on paper
 * in a meeting. So it carries four things the screen can take for granted: what
 * the document is, which run produced it, that it contains no patient data
 * beyond the id, and a page number on every page.
 *
 * It is built from the same `ExtractionGroup[]` the card renders — corrections
 * included, since the reviewer edits the rows the file is made of — so the file
 * and the screen cannot drift apart. A corrected row is marked and counted
 * rather than passed off as extracted: the whole value of this document is that
 * a figure on it can be traced back to a line of a contract, and a hand-typed
 * number that does not say so spends that credit without earning it.
 *
 * What it deliberately leaves out is the
 * evidence quotes: they are verbatim policy text, they are what the *reviewer*
 * checks a value against, and pasting pages of contract language into a
 * document meant to be forwarded turns a one-page summary into a bundle nobody
 * reads.
 */
export function buildExtractionPdf(
  groups: readonly ExtractionGroup[],
  header: readonly RunSummaryRow[],
): Uint8Array<ArrayBuffer> {
  const pdf = new PdfBuilder()
  pdf.bottom(BODY_BOTTOM)

  pdf.text(t('extraction.title'), { size: 17, font: 'bold', grey: 0.05 })
  pdf.space(5)

  // Counted before the empty groups are dropped, though the two agree: a group
  // with no rows has no corrected rows either.
  const edited = countEdits(groups)

  pdf.frame(MARGIN, INTRO_WIDTH)
  pdf.text(t('extraction.pdfIntro'), { size: 8.4, grey: 0.42, leading: 11.5 })

  // Set darker than the paragraph above it and directly under it, not in the
  // footer: a reader who takes one figure off this page and stops reading must
  // still have been told that some figures on it are a person's correction and
  // not the contract's own words.
  if (edited > 0) {
    pdf.space(6)
    pdf.text(t('extraction.pdfEditedNote', { count: edited }), {
      size: 8.4,
      font: 'bold',
      grey: 0.2,
      leading: 11.5,
    })
  }

  pdf.frame(MARGIN, CONTENT_WIDTH)

  pdf.space(15)
  identityBand(pdf, header)
  pdf.space(20)

  // A group whose fields the schema does not carry — an analysis stored before
  // these sections existed — is dropped here rather than printing a heading
  // over an empty space that reads as a rendering fault.
  const sections = groups.filter((group) => group.rows.length > 0)

  const columnTop = pdf.y
  let column = 0
  let top = columnTop

  const enterColumn = (): void => {
    pdf.frame(MARGIN + column * (COLUMN_WIDTH + COLUMN_GAP), COLUMN_WIDTH)
    pdf.moveTo(top)
  }

  const nextColumn = (): void => {
    if (column === 0) {
      column = 1
    } else {
      pdf.newPage()
      column = 0
      top = CONTINUED_TOP
    }
    enterColumn()
  }

  // Armed before measuring so a section too tall for any column still lands
  // somewhere sensible instead of running off the bottom of the page.
  pdf.onOverflow(nextColumn)
  enterColumn()

  const heights = sections.map((group) => pdf.measure(() => section(pdf, group)))
  const split = balancedSplit(heights, SECTION_GAP, BODY_BOTTOM - columnTop)

  sections.forEach((group, index) => {
    if (index === split) nextColumn()
    else if (index > 0) pdf.space(SECTION_GAP)

    section(pdf, group)
  })

  const runId = header.find((row) => row.key === 'runId')?.value ?? ''

  pdf.decorate((index) => {
    // The confidential notice repeats on every page, because pages get
    // separated and the one that says what may be done with this document
    // should not be the one left in the printer. It is set from the bottom up
    // so its last line shares the page number's baseline however many lines it
    // runs to, and the two read as one band rather than two strays.
    // The standard footer vouches that every value traces to a quote in the
    // console. Once a reviewer has typed one, that sentence is false, so the
    // document says the narrower true thing instead of the broad untrue one.
    const footer = edited > 0 ? 'extraction.pdfFooterEdited' : 'extraction.pdfFooter'
    const note = wrapText(toWinAnsi(t(footer)), 6.8, CONTENT_WIDTH - 74)

    note.forEach((line, position) => {
      const y = FOOTER_BASELINE - (note.length - 1 - position) * NOTE_LEADING
      pdf.drawText(line, MARGIN, y, { size: 6.8, grey: 0.52 })
    })

    pdf.drawRule(MARGIN, FOOTER_BASELINE - (note.length - 1) * NOTE_LEADING - 11, CONTENT_WIDTH, 0.8)

    if (index === 0) return

    pdf.drawText(`${t('extraction.title')} · ${runId}`, MARGIN, 44, { size: 7.6, grey: 0.5 })
    pdf.drawRule(MARGIN, 52, CONTENT_WIDTH, 0.8)
  })

  return pdf.build()
}
