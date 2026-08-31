import { useMemo, useRef, useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'

import {
  buildSegments,
  overlapsExisting,
  selectionToRange,
  splitPages,
  trimRange,
} from '../lib/segments'
import type { ExtractedDocument, RedactionSpan } from '../model/types'

interface RedactionReviewProps {
  document: ExtractedDocument
  isSubmitting: boolean
  onConfirm: (approved: RedactionSpan[]) => void
  onCancel: () => void
}

/** Manual additions get ids above the server's, so the two never collide. */
const MANUAL_ID_BASE = 1_000_000

/**
 * The review screen: what the detector found, what the operator decides.
 *
 * This is the only place in the product where a human stands between a
 * document and a third-party model, so the screen is built to make that
 * decision cheap rather than to make it look thorough. Concretely:
 *
 * - High and medium confidence spans arrive already checked. The common case is
 *   "the detector was right", and making someone tick forty boxes to agree with
 *   it guarantees they will stop reading by box six.
 * - Low confidence spans arrive listed but unchecked. Vigencia dates are the
 *   whole reason: they look exactly like a date of birth and they are needed
 *   for the analysis, so removing them by default would quietly break the
 *   product to look safe.
 * - Anything the detector missed can be selected in the text and redacted by
 *   hand, because the detector will miss things and a review screen with no way
 *   to act on that is theatre.
 */
export function RedactionReview({
  document,
  isSubmitting,
  onConfirm,
  onCancel,
}: RedactionReviewProps) {
  const { t } = useTranslation()
  const paneRef = useRef<HTMLDivElement>(null)

  const [spans, setSpans] = useState<RedactionSpan[]>(document.spans)
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(document.spans.filter((span) => span.selected_by_default).map((span) => span.id)),
  )
  const [pageIndex, setPageIndex] = useState(0)
  const [pendingRange, setPendingRange] = useState<{ start: number; end: number } | null>(null)

  const pages = useMemo(() => splitPages(document.text), [document.text])

  // `splitPages` always yields at least one page, but the array type cannot say
  // so. The fallback states the invariant rather than asserting past it — and
  // it is memoised, because an object literal rebuilt every render would make
  // `segments` recompute on every keystroke over a 400 000-character document.
  const page = useMemo(
    () =>
      pages[Math.min(pageIndex, pages.length - 1)] ?? {
        index: 0,
        label: '1',
        start: 0,
        end: document.text.length,
      },
    [pages, pageIndex, document.text.length],
  )

  const segments = useMemo(
    () => buildSegments(document.text, spans, page.start, page.end),
    [document.text, spans, page],
  )

  const grouped = useMemo(() => {
    const groups = new Map<string, RedactionSpan[]>()
    for (const span of spans) {
      const list = groups.get(span.category) ?? []
      list.push(span)
      groups.set(span.category, list)
    }
    return [...groups.entries()].sort((left, right) => right[1].length - left[1].length)
  }, [spans])

  // A blocking category left unchecked will be refused by the server, so it is
  // surfaced here rather than as a 422 after the operator clicks through.
  const unresolvedBlocking = useMemo(
    () => spans.filter((span) => span.blocking && !selected.has(span.id)),
    [spans, selected],
  )

  const toggle = (id: number): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (category: string, on: boolean): void => {
    setSelected((current) => {
      const next = new Set(current)
      for (const span of spans) {
        if (span.category !== category) continue
        if (on) next.add(span.id)
        else next.delete(span.id)
      }
      return next
    })
  }

  const captureSelection = (): void => {
    const pane = paneRef.current
    if (!pane) return

    const raw = selectionToRange(pane)
    const trimmed = raw ? trimRange(document.text, raw) : null

    setPendingRange(trimmed && !overlapsExisting(spans, trimmed) ? trimmed : null)
  }

  const addManualSpan = (): void => {
    if (!pendingRange) return

    const span: RedactionSpan = {
      id: MANUAL_ID_BASE + spans.length,
      start: pendingRange.start,
      end: pendingRange.end,
      category: 'NOMBRE',
      confidence: 'high',
      text: document.text.slice(pendingRange.start, pendingRange.end),
      context_before: '',
      context_after: '',
      selected_by_default: true,
      blocking: false,
    }

    setSpans((current) => [...current, span])
    setSelected((current) => new Set(current).add(span.id))
    setPendingRange(null)
    globalThis.getSelection()?.removeAllRanges()
  }

  const handleConfirm = (): void => {
    onConfirm(spans.filter((span) => selected.has(span.id)))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-medium text-body">{t('redaction.title')}</h2>
          <p className="text-[12px] text-muted">
            {t('redaction.summary', {
              selected: String(selected.size),
              total: String(spans.length),
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={unresolvedBlocking.length > 0}
          >
            {t('redaction.confirm')}
          </Button>
        </div>
      </div>

      {document.ocr_page_count > 0 ? (
        <Alert tone="info">
          {t('redaction.ocrNotice', {
            pages: String(document.ocr_page_count),
            total: String(document.page_count),
          })}
        </Alert>
      ) : null}

      {document.previously_analyzed ? (
        <Alert tone="warning">{t('redaction.duplicate')}</Alert>
      ) : null}

      {unresolvedBlocking.length > 0 ? (
        <Alert tone="error">
          {t('redaction.blocking', { count: String(unresolvedBlocking.length) })}
        </Alert>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Document pane */}
        <div className="flex min-h-0 flex-col rounded-sm border border-line bg-canvas">
          {pages.length > 1 ? (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
              {pages.map((candidate, index) => (
                <button
                  key={candidate.index}
                  type="button"
                  onClick={() => setPageIndex(index)}
                  className={cn(
                    'shrink-0 rounded-xs px-2.5 py-1 text-[11.5px] transition-colors',
                    index === pageIndex
                      ? 'bg-ink text-on-ink'
                      : 'text-muted hover:bg-surface-sunk hover:text-body',
                  )}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          ) : null}

          {pendingRange ? (
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-sunk px-3 py-2">
              <span className="truncate text-[11.5px] text-muted">
                {t('redaction.selectionPreview', {
                  text: document.text.slice(pendingRange.start, pendingRange.end).slice(0, 60),
                })}
              </span>
              <Button size="sm" onClick={addManualSpan} leadingIcon={<Icon name="shield" className="size-3.5" />}>
                {t('redaction.redactSelection')}
              </Button>
            </div>
          ) : null}

          <div
            ref={paneRef}
            onMouseUp={captureSelection}
            onKeyUp={captureSelection}
            className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-[1.7] whitespace-pre-wrap text-body"
          >
            {segments.map((segment) => {
              if (!segment.span) {
                return (
                  <span key={segment.start} data-offset={segment.start}>
                    {segment.text}
                  </span>
                )
              }

              const span = segment.span
              const isOn = selected.has(span.id)

              return (
                <button
                  key={segment.start}
                  type="button"
                  data-offset={segment.start}
                  onClick={() => toggle(span.id)}
                  title={span.category}
                  className={cn(
                    'rounded-[3px] px-0.5 text-left transition-colors',
                    isOn
                      // Redacted: the text is still readable underneath on
                      // purpose. The operator has to be able to check that the
                      // right thing is being removed, and a solid black bar
                      // makes the review impossible to actually perform.
                      ? 'bg-ink/85 text-on-ink line-through decoration-1'
                      : 'bg-warning/20 underline decoration-warning decoration-dotted underline-offset-2',
                  )}
                >
                  {segment.text}
                </button>
              )
            })}
          </div>
        </div>

        {/* Entity sidebar */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-auto rounded-sm border border-line bg-canvas p-3">
          {grouped.length === 0 ? (
            <p className="px-1 py-6 text-center text-[12px] text-muted">
              {t('redaction.noneDetected')}
            </p>
          ) : (
            grouped.map(([category, items]) => {
              const on = items.filter((span) => selected.has(span.id)).length
              const allOn = on === items.length

              return (
                <section key={category} className="flex flex-col gap-1.5">
                  <header className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium tracking-wide text-body">
                      {category}
                      <span className="ml-1.5 text-faint">
                        {on}/{items.length}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category, !allOn)}
                      className="text-[10.5px] text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
                    >
                      {allOn ? t('redaction.none') : t('redaction.all')}
                    </button>
                  </header>

                  <ul className="flex flex-col gap-1">
                    {items.map((span) => (
                      <li key={span.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded-xs px-1.5 py-1 transition-colors',
                            'hover:bg-surface-sunk',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(span.id)}
                            onChange={() => toggle(span.id)}
                            className="mt-0.75 size-3 shrink-0 accent-ink"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-[11px] text-body">
                              {span.text}
                            </span>
                            {span.confidence === 'low' ? (
                              <span className="text-[10px] text-faint">
                                {t('redaction.lowConfidence')}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })
          )}
        </aside>
      </div>
    </div>
  )
}
