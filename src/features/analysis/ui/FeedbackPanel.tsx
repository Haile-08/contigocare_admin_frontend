import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input, Textarea } from '@/shared/ui/Field'

import { useSubmitFeedbackMutation } from '../api/analysisApi'
import type {
  Analisis,
  FeedbackVerdict,
  FieldCorrection,
  StoredFeedback,
} from '../model/types'
import { CAMPO_SECTIONS } from '../model/types'

interface FeedbackPanelProps {
  analysisId: string
  analysis: Analisis
  /** A verdict already on record. Present means this is an edit, not a first review. */
  existing?: StoredFeedback | null
  /** Label for the submit button. Defaults to "Submit review". */
  submitLabel?: string
  /** Called after the verdict is stored — the wizard uses it to move on. */
  onSaved?: () => void
}

const VERDICTS: FeedbackVerdict[] = ['correct', 'partially_correct', 'incorrect']

/** Normalises a stored correction, whose fields are optional on the wire. */
function toCorrections(existing: StoredFeedback | null | undefined): Record<string, FieldCorrection> {
  if (!existing) return {}
  return Object.fromEntries(
    Object.entries(existing.field_corrections).map(([path, correction]) => [
      path,
      { was: correction.was ?? null, should_be: correction.should_be ?? null },
    ]),
  )
}

/**
 * The reviewer's verdict — the single highest-value thing this product records.
 *
 * An analysis without one is a log line. An analysis with one is a labelled
 * example that `evals/build_golden_set.py` turns into a regression case, so
 * every review makes the next prompt version measurable. That is the entire
 * improvement loop, and it runs on this form.
 *
 * Field corrections matter more than the overall verdict. "Incorrect" tells you
 * something was wrong; `coberturas.deducible: was "$5,000", should be
 * "$15,000"` tells you what, and an empty `should_be` records the case the
 * golden set most needs — a value the agent invented.
 *
 * A verdict can be revised. The form loads whatever is on record and posting
 * again replaces it, because a reviewer who got their own review wrong should
 * be able to fix it — and because two verdicts on one analysis would count it
 * twice everywhere the numbers are computed.
 */
export function FeedbackPanel({
  analysisId,
  analysis,
  existing,
  submitLabel,
  onSaved,
}: FeedbackPanelProps) {
  const { t, fmt } = useTranslation()
  const [submit, { isLoading, isSuccess, error }] = useSubmitFeedbackMutation()

  // Seeded once from what is on record. The panel is remounted with a `key` on
  // the analysis id when the screen switches analyses, so there is no stale
  // state to sync — and no effect that would overwrite the reviewer's edits the
  // moment the query refetched.
  const [verdict, setVerdict] = useState<FeedbackVerdict | null>(existing?.verdict ?? null)
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>(() =>
    toCorrections(existing),
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [showFields, setShowFields] = useState(
    () => Object.keys(toCorrections(existing)).length > 0,
  )
  // Set by any edit after a save, so the confirmation does not sit above a form
  // whose contents no longer match what was stored.
  const [touched, setTouched] = useState(false)

  // Every extracted field, across every section — the paths here are the ones
  // the golden set is keyed by, so a section the reviewer cannot correct is a
  // section the eval harness has nothing to score against.
  const correctableFields = CAMPO_SECTIONS.flatMap(([sectionName, order]) => {
    const section = analysis[sectionName]
    return order
      .filter((key) => key in section)
      .map((key) => [`${sectionName}.${key}`, section[key]?.valor ?? null] as const)
  })

  const setCorrection = (path: string, was: string | null, shouldBe: string): void => {
    setTouched(true)
    setCorrections((current) => {
      const next = { ...current }
      if (shouldBe.trim() === '' && !(path in next)) {
        return next
      }
      next[path] = { was, should_be: shouldBe.trim() === '' ? null : shouldBe }
      return next
    })
  }

  const clearCorrection = (path: string): void => {
    setTouched(true)
    setCorrections((current) => {
      const next = { ...current }
      delete next[path]
      return next
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!verdict) return
    try {
      await submit({ analysisId, verdict, fieldCorrections: corrections, notes }).unwrap()
      setTouched(false)
      onSaved?.()
    } catch {
      // Surfaced from the mutation's own `error`.
    }
  }

  const saved = isSuccess && !touched

  return (
    <Card>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-medium text-body">
            {existing ? t('feedback.editTitle') : t('feedback.title')}
          </h3>
          <p className="text-[11.5px] leading-relaxed text-muted">
            {existing
              ? t('feedback.editedOn', { date: fmt.relative(existing.created_at) })
              : t('feedback.why')}
          </p>
        </div>

        {saved ? <Alert tone="success">{t('feedback.thanks')}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          {VERDICTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setTouched(true)
                setVerdict(option)
              }}
              aria-pressed={verdict === option}
              className={cn(
                'rounded-xs border px-3 py-1.5 text-[12px] transition-colors',
                verdict === option
                  ? 'border-ink bg-ink text-on-ink'
                  : 'border-line-soft text-muted hover:border-line-strong hover:text-body',
              )}
            >
              {t(`feedback.verdict.${option}`)}
            </button>
          ))}
        </div>

        {verdict && verdict !== 'correct' ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowFields((current) => !current)}
              className="self-start text-[11.5px] text-muted underline-offset-2 transition-colors hover:text-body hover:underline"
            >
              {showFields ? t('feedback.hideFields') : t('feedback.correctFields')}
            </button>

            {showFields ? (
              <div className="flex max-h-80 flex-col gap-2 overflow-auto rounded-xs border border-line-soft p-3">
                <p className="text-[10.5px] leading-relaxed text-faint">
                  {t('feedback.correctionHint')}
                </p>

                {correctableFields.map(([path, was]) => (
                  <div key={path} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate font-mono text-[10.5px] text-muted">
                      {path.split('.')[1]}
                    </span>
                    <span className="w-28 shrink-0 truncate text-[11px] text-faint">
                      {was ?? '—'}
                    </span>
                    <Input
                      aria-label={t('feedback.shouldBe', { field: path })}
                      placeholder={t('feedback.shouldBePlaceholder')}
                      className="h-8 flex-1 px-2 text-[11.5px]"
                      wrapperClassName="flex-1"
                      value={corrections[path]?.should_be ?? ''}
                      onChange={(event) => {
                        if (event.target.value === '' && corrections[path]?.should_be === null) {
                          return
                        }
                        setCorrection(path, was, event.target.value)
                      }}
                    />
                    <button
                      type="button"
                      title={t('feedback.markInvented')}
                      onClick={() =>
                        corrections[path]?.should_be === null
                          ? clearCorrection(path)
                          : setCorrection(path, was, '')
                      }
                      className={cn(
                        'shrink-0 rounded-xs border px-2 py-1 text-[10.5px] transition-colors',
                        corrections[path] && corrections[path].should_be === null
                          ? 'border-critical bg-critical/10 text-critical'
                          : 'border-line-soft text-faint hover:border-line-strong hover:text-muted',
                      )}
                    >
                      {t('feedback.invented')}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Textarea
          label={t('feedback.notes')}
          rows={2}
          value={notes}
          maxLength={4000}
          className="text-[12px]"
          onChange={(event) => {
            setTouched(true)
            setNotes(event.target.value)
          }}
        />

        {error ? <Alert tone="error">{t('feedback.failed')}</Alert> : null}

        <Button
          onClick={() => void handleSubmit()}
          isLoading={isLoading}
          disabled={!verdict}
          className="self-start"
        >
          {submitLabel ?? (existing ? t('feedback.saveChanges') : t('feedback.submit'))}
        </Button>
      </div>
    </Card>
  )
}
