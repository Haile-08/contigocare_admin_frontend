import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { logger } from '@/shared/lib/logger'
import { Badge } from '@/shared/ui/Badge'
import type { BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'

import {
  applyEdits,
  applyHeaderEdits,
  clearEdit,
  countEdits,
  editKey,
  isEditable,
  setEdit,
} from '../lib/extractionEdits'
import type { ExtractionEdits } from '../lib/extractionEdits'
import { buildExtractionPdf } from '../lib/extractionPdf'
import { buildPolicyExtraction } from '../lib/policyExtraction'
import type { ExtractionRow } from '../lib/policyExtraction'
import { PLACEHOLDER, buildRunSummary, exportFileName } from '../lib/runSummary'
import type { UrgencyLevel } from '../lib/runSummary'
import type { Analisis, AnalysisResult, Confianza } from '../model/types'

const URGENCY_TONE: Record<UrgencyLevel, BadgeTone> = {
  CRITICAL: 'critical',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  INFO: 'info',
}

const CONFIDENCE_LABEL: Record<Confianza, TranslationKey> = {
  alta: 'confidence.alta',
  media: 'confidence.media',
  baja: 'confidence.baja',
  no_encontrado: 'confidence.no_encontrado',
}

const CONFIDENCE_TONE: Record<Confianza, string> = {
  alta: 'text-positive',
  media: 'text-warning',
  baja: 'text-critical',
  no_encontrado: 'text-faint',
}

interface FieldRowProps {
  groupKey: string
  row: ExtractionRow
  /** Whether the table is in edit mode. Off, the row is read-only as before. */
  editing: boolean
  /** The reviewer's raw draft for this row, before it is trimmed and applied. */
  draft: string | undefined
  onEdit: (value: string) => void
  onRevert: () => void
}

/**
 * One extracted term, with the line of the policy it came from.
 *
 * The quote is the reason this screen exists. A `tope de coaseguro` with no
 * traceable source is a number somebody has to go and verify by hand, which is
 * the work the tool was supposed to remove — so the source sits one click from
 * the value, and a field with no quote looks different from one that has been
 * checked rather than identical to it.
 *
 * A row the reviewer has corrected shows both values. The correction is what
 * goes out; the extracted value stays under it, next to the same quote it
 * always had, because that quote is now evidence about the *disagreement* —
 * it is how the next reader judges whether the correction was right.
 */
function ExtractionFieldRow({ groupKey, row, editing, draft, onEdit, onRevert }: FieldRowProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const campo = row.campo
  // Whether there is something to show, not whether it came from a `Campo`: a
  // derived row like the policy period has no field behind it and is still a
  // value the reader needs.
  const missing = row.value === PLACEHOLDER
  const edited = row.original !== undefined
  const evidenceId = `${groupKey}-${row.key}-evidence`

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2 last:border-b-0">
      <dt className="shrink-0 text-[11.5px] text-muted">{t(row.label)}</dt>

      <dd className="flex min-w-0 flex-col items-end gap-1 text-right">
        {editing ? (
          <span className="flex items-center gap-1.5">
            <Input
              aria-label={t('extraction.editField', { field: t(row.label) })}
              // Blank rather than the placeholder glyph: the reviewer types the
              // value the policy states, and an em dash pre-filled in the box
              // is a character they have to delete first.
              value={draft ?? (missing ? '' : row.value)}
              onChange={(event) => onEdit(event.target.value)}
              className="h-7 px-2 text-right text-[12px]"
              wrapperClassName="w-44"
            />
            {/* Absent rather than disabled on an untouched row: a hidden
                control is still a stop on the keyboard's way down the table,
                and there are sixty of these. The cell keeps its width so the
                inputs stay in one line as rows are corrected. */}
            {edited ? (
              <button
                type="button"
                onClick={onRevert}
                title={t('extraction.revert')}
                aria-label={t('extraction.revert')}
                className="size-5 shrink-0 rounded-xs text-faint transition-colors hover:bg-surface-sunk hover:text-body"
              >
                <Icon name="close" className="mx-auto size-3" />
              </button>
            ) : (
              <span className="size-5 shrink-0" aria-hidden="true" />
            )}
          </span>
        ) : (
          <span className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-[12.5px] wrap-break-word',
                missing ? 'text-faint italic' : 'font-medium text-body select-all',
              )}
            >
              {missing ? t('analysis.notFound') : row.value}
            </span>

            {/* Derived rows — the extraction score, the policy period — have no
                confidence of their own, and a dot next to them would imply the
                agent asserted something it did not. The placeholder keeps the
                value column aligned with the rows that do have one.

                A corrected row loses its dot too, and for the same reason: the
                confidence is the agent's, about the value underneath, and
                leaving it beside a value a person typed would read as the model
                vouching for their number. */}
            {edited ? (
              <span
                title={t('extraction.editedMarker')}
                aria-label={t('extraction.editedMarker')}
                className="shrink-0 text-info"
              >
                <Icon name="pencil" className="size-2.5" />
              </span>
            ) : campo ? (
              <span
                title={t(CONFIDENCE_LABEL[campo.confianza])}
                aria-label={t(CONFIDENCE_LABEL[campo.confianza])}
                className={cn('shrink-0 text-[9px]', CONFIDENCE_TONE[campo.confianza])}
              >
                ●
              </span>
            ) : (
              <span className="shrink-0 text-[9px] text-transparent" aria-hidden="true">
                ●
              </span>
            )}
          </span>
        )}

        {edited ? (
          <span className="text-[10.5px] text-faint">
            {t('extraction.editedWas', {
              value: row.original === PLACEHOLDER ? t('analysis.notFound') : (row.original ?? ''),
            })}
          </span>
        ) : null}

        {campo?.evidencia ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="text-[10.5px] text-faint underline-offset-2 transition-colors hover:text-muted hover:underline"
            aria-expanded={open}
            aria-controls={evidenceId}
          >
            {open ? t('analysis.hideEvidence') : t('analysis.showEvidence')}
          </button>
        ) : null}

        {open && campo?.evidencia ? (
          <blockquote
            id={evidenceId}
            className="border-l-2 border-line-strong bg-surface-sunk px-2.5 py-1.5 text-left font-mono text-[10.5px] leading-relaxed text-muted"
          >
            {campo.evidencia}
            {campo.pagina ? (
              <footer className="mt-1 text-faint">
                {t('analysis.page', { page: String(campo.pagina) })}
              </footer>
            ) : null}
          </blockquote>
        ) : null}
      </dd>
    </div>
  )
}

/**
 * Section 2 of the coverage report: the policy extraction.
 *
 * This is the factual backbone of everything else on the screen. The alerts,
 * the deadlines and the plan are all interpretation of these terms, so they are
 * stated first, grouped the way the report groups them, with the run's identity
 * above them — insurer, patient, urgency, run id — because the table travels
 * and a policy term detached from the policy it came from is unusable.
 *
 * Both readings of the same rows are here: the reviewer's, who opens the quote
 * behind a value and confirms it against the document, and the broker's, who
 * gets **Download PDF** — the same rows, the same order, no evidence quotes,
 * one file.
 *
 * Between the two sits **Edit values**. An operator who has the document open
 * can see what a mangled OCR pass got wrong, and until now the only ways to act
 * on it were to send the broker a figure they knew was wrong or to rebuild the
 * table by hand in another program. The corrections stay an overlay — see
 * `extractionEdits` for why the stored analysis is never touched — and they are
 * marked here and in the exported file, so nobody downstream has to take a
 * typed number for an extracted one.
 */
export function PolicyExtractionCard({
  analysis,
  meta,
}: {
  analysis: Analisis
  meta: AnalysisResult
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [edits, setEdits] = useState<ExtractionEdits>({})

  const groups = applyEdits(buildPolicyExtraction(analysis, meta), edits)
  const header = applyHeaderEdits(buildRunSummary(analysis, meta), edits)
  const urgency = header.find((row) => row.key === 'urgency')?.value as UrgencyLevel | undefined
  const edited = countEdits(groups)

  const handleDownload = (): void => {
    let url = ''

    try {
      const bytes = buildExtractionPdf(groups, header)
      url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))

      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName(meta)
      link.click()
      setFailed(false)
    } catch (error) {
      // The table is on screen and selectable. Say the file failed rather than
      // leaving the operator waiting for a download that is never coming.
      logger.error('extraction_pdf_failed', { error })
      setFailed(true)
    } finally {
      // Revoked on the next tick, not immediately: the click is synchronous but
      // the browser reads the URL after this frame, and a revoked blob saves as
      // a zero-byte file in Safari.
      if (url) setTimeout(() => URL.revokeObjectURL(url), 0)
    }
  }

  return (
    <Card>
      <CardHeader
        title={t('extraction.title')}
        description={t('extraction.description')}
        action={
          <div className="flex items-center gap-2">
            {urgency ? <Badge tone={URGENCY_TONE[urgency]}>{urgency}</Badge> : null}
            <Button
              variant={editing ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setEditing((current) => !current)}
              leadingIcon={<Icon name={editing ? 'check' : 'pencil'} className="size-3.5" />}
            >
              {t(editing ? 'extraction.doneEditing' : 'extraction.edit')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              leadingIcon={<Icon name="download" className="size-3.5" />}
            >
              {t('extraction.download')}
            </Button>
          </div>
        }
      />

      {/* Stated above the table rather than beside the button, because it is a
          fact about every row underneath: what is on screen is no longer purely
          what the agent extracted. */}
      {editing || edited > 0 ? (
        <div className="mx-4.5 mb-2 flex items-center justify-between gap-4 rounded-xs border border-line-soft bg-surface-sunk px-3 py-2">
          <p className="text-[11px] leading-relaxed text-muted">
            {edited > 0 ? t('extraction.editedNotice', { count: edited }) : t('extraction.editHint')}
          </p>

          {edited > 0 ? (
            <button
              type="button"
              onClick={() => setEdits({})}
              className="shrink-0 text-[11px] text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
            >
              {t('extraction.resetEdits')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-x-8 px-4.5 pb-4 xl:grid-cols-2">
        {groups.map((group) =>
          // A section a run stored under an older schema never carried is left
          // out entirely. A column of dashes under "Exclusiones y limitaciones"
          // would read as a policy that names no exclusions, which is a
          // different — and far more actionable — claim than "this run predates
          // the question".
          group.rows.length === 0 ? null : (
            <section key={group.key}>
              <h4 className="border-b border-line-strong pt-2.5 pb-1.5 text-[10.5px] font-medium tracking-wide text-faint uppercase">
                {t(group.title)}
              </h4>
              <dl>
                {group.rows.map((row) => (
                  <ExtractionFieldRow
                    key={row.key}
                    groupKey={group.key}
                    row={row}
                    // A derived row stays read-only even in edit mode: the
                    // period follows the two dates above it, and the score and
                    // the run date are the console's own claims about itself.
                    editing={editing && isEditable(group.key, row.key)}
                    draft={edits[editKey(group.key, row.key)]}
                    onEdit={(value) =>
                      setEdits((current) => setEdit(current, group.key, row.key, value))
                    }
                    onRevert={() =>
                      setEdits((current) => clearEdit(current, group.key, row.key))
                    }
                  />
                ))}
              </dl>
            </section>
          ),
        )}
      </div>

      {failed ? (
        <p role="status" className="px-4.5 pb-4 text-[11px] text-critical">
          {t('extraction.downloadFailed')}
        </p>
      ) : null}
    </Card>
  )
}
