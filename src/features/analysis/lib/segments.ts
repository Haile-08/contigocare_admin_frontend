import type { RedactionSpan } from '../model/types'

/**
 * Turning `(text, spans)` into something renderable.
 *
 * The document pane needs three things at once: to show the text, to mark where
 * the detector found identifiers, and to let the operator select a range that
 * the detector *missed* and redact it by hand. All three need character offsets
 * into the original string, so every rendered piece of text carries the offset
 * it starts at.
 */

export interface Segment {
  start: number
  end: number
  text: string
  /** Null for ordinary prose between detections. */
  span: RedactionSpan | null
}

/** A page of the extracted document, as split on the extractor's markers. */
export interface DocumentPage {
  index: number
  label: string
  start: number
  end: number
}

const PAGE_MARKER = /^--- Página (\d+) ---$/gm

/**
 * Splits extracted text into pages.
 *
 * The extractor emits a `--- Página N ---` line per page. Rendering a 60-page
 * policy as one DOM tree is tens of thousands of nodes and makes text selection
 * crawl, so the pane renders one page at a time. A document with no markers —
 * a plain-text upload, say — comes back as a single page, which is correct
 * rather than a special case.
 */
export function splitPages(text: string): DocumentPage[] {
  const pages: DocumentPage[] = []
  const matches = [...text.matchAll(PAGE_MARKER)]

  if (matches.length === 0) {
    return [{ index: 0, label: '1', start: 0, end: text.length }]
  }

  matches.forEach((match, position) => {
    const start = match.index ?? 0
    const next = matches[position + 1]
    pages.push({
      index: position,
      label: match[1] ?? String(position + 1),
      start,
      end: next?.index ?? text.length,
    })
  })

  return pages
}

/**
 * Builds the render list for one slice of the document.
 *
 * Spans are assumed non-overlapping — the server resolves overlaps before
 * sending them, and manual additions are rejected if they collide. Anything
 * that slipped through is skipped rather than allowed to produce garbled text.
 */
export function buildSegments(
  text: string,
  spans: RedactionSpan[],
  from = 0,
  to = text.length,
): Segment[] {
  const relevant = spans
    .filter((span) => span.end > from && span.start < to)
    .sort((left, right) => left.start - right.start)

  const segments: Segment[] = []
  let cursor = from

  for (const span of relevant) {
    if (span.start < cursor) continue

    if (span.start > cursor) {
      segments.push({
        start: cursor,
        end: span.start,
        text: text.slice(cursor, span.start),
        span: null,
      })
    }

    segments.push({
      start: span.start,
      end: span.end,
      text: text.slice(span.start, span.end),
      span,
    })

    cursor = span.end
  }

  if (cursor < to) {
    segments.push({ start: cursor, end: to, text: text.slice(cursor, to), span: null })
  }

  return segments
}

/**
 * Maps a DOM selection back to offsets in the original text.
 *
 * Each rendered segment carries `data-offset`, so a selection anchored inside
 * one resolves to `segment offset + offset within the node`. Returns null when
 * the selection is empty, collapsed, or strays outside the document pane —
 * which is what happens when someone double-clicks in the sidebar.
 */
export function selectionToRange(container: HTMLElement): { start: number; end: number } | null {
  const selection = globalThis.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const resolve = (node: Node, offset: number): number | null => {
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
    const holder = element?.closest<HTMLElement>('[data-offset]')
    if (!holder) return null

    const base = Number(holder.dataset['offset'])
    if (!Number.isFinite(base)) return null

    // Only the first text node of a segment is addressed, so the offset within
    // the node is the offset within the segment.
    return base + offset
  }

  const start = resolve(range.startContainer, range.startOffset)
  const end = resolve(range.endContainer, range.endOffset)

  if (start === null || end === null || start >= end) return null

  return { start, end }
}

/** Trims a selected range so it does not include leading or trailing space. */
export function trimRange(
  text: string,
  range: { start: number; end: number },
): { start: number; end: number } | null {
  let { start, end } = range

  while (start < end && /\s/.test(text[start] ?? '')) start += 1
  while (end > start && /\s/.test(text[end - 1] ?? '')) end -= 1

  return end > start ? { start, end } : null
}

export function overlapsExisting(
  spans: RedactionSpan[],
  range: { start: number; end: number },
): boolean {
  return spans.some((span) => range.start < span.end && span.start < range.end)
}
