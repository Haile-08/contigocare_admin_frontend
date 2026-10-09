import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input, Textarea } from '@/shared/ui/Field'

import { useSubmitNavigationFeedbackMutation } from '../api/analysisApi'
import {
  flaggedCount,
  initialSectionDrafts,
  reviewableSections,
  toSectionPayload,
} from '../lib/navigationFeedback'
import type { SectionDrafts } from '../lib/navigationFeedback'
import { NAVIGATION_SECTION_LABEL } from '../model/navigation'
import type { NavigationRun, NavigationSection, NavigationVerdict } from '../model/navigation'

const VERDICTS: NavigationVerdict[] = ['correct', 'partially_correct', 'incorrect']

interface NavigationFeedbackPanelProps {
  run: NavigationRun
}

/**
 * The coordinator's verdict on a finished navigation.
 *
 * Five agents wrote this report, and "partly wrong" does not say which one to
 * look at. So beside the overall call each section of the report can be flagged
 * and given a comment — a deadline the planner got wrong, a projection the
 * optimizer overstated, a letter that cites the wrong clause.
 *
 * Only the sections this report printed are offered. A verdict on record is
 * loaded and posting again revises it, as with the analysis review. The panel is
 * remounted per navigation, so a re-run starts from a blank review.
 */
export function NavigationFeedbackPanel({ run }: NavigationFeedbackPanelProps) {
  const { t, fmt } = useTranslation()
  const [submit, { isLoading, isSuccess, error }] = useSubmitNavigationFeedbackMutation()

  const existing = run.feedback
  const sections = reviewableSections(run.result)

  const [verdict, setVerdict] = useState<NavigationVerdict | null>(existing?.verdict ?? null)
  const [drafts, setDrafts] = useState<SectionDrafts>(() => initialSectionDrafts(existing))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [touched, setTouched] = useState(false)

  const updateSection = (section: NavigationSection, change: Partial<{ flagged: boolean; comment: string }>) => {
    setTouched(true)
    setDrafts((current) => {
      const previous = current[section] ?? { flagged: false, comment: '' }
      return { ...current, [section]: { ...previous, ...change } }
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!verdict) return
    try {
      await submit({
        navigationId: run.navigation_id,
        analysisId: run.analysis_id,
        verdict,
        sections: toSectionPayload(drafts, sections),
        notes,
      }).unwrap()
      setTouched(false)
    } catch {
      // Surfaced from the mutation's own `error`.
    }
  }

  const saved = isSuccess && !touched
  const flagged = flaggedCount(drafts, sections)

  return (
    <Card>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-medium text-body">
            {existing ? t('navigationFeedback.editTitle') : t('navigationFeedback.title')}
          </h3>
          <p className="text-[11.5px] leading-relaxed text-muted">
            {existing
              ? t('feedback.editedOn', { date: fmt.relative(existing.created_at) })
              : t('navigationFeedback.why')}
          </p>
        </div>

        {saved ? <Alert tone="success">{t('navigationFeedback.thanks')}</Alert> : null}

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

        {sections.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11.5px] font-medium text-body">{t('navigationFeedback.sectionsTitle')}</p>
              {flagged > 0 ? (
                <span className="text-[11px] text-critical">
                  {t('navigationFeedback.flaggedCount', { count: flagged })}
                </span>
              ) : null}
            </div>
            <p className="text-[10.5px] leading-relaxed text-faint">{t('navigationFeedback.sectionsHint')}</p>

            <ul className="flex flex-col divide-y divide-line-soft rounded-xs border border-line-soft">
              {sections.map((section) => {
                const draft = drafts[section]
                const label = t(NAVIGATION_SECTION_LABEL[section])
                return (
                  <li key={section} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                    <span className="text-[11.5px] text-muted sm:w-56 sm:shrink-0">{label}</span>
                    <button
                      type="button"
                      aria-pressed={draft?.flagged ?? false}
                      aria-label={t('navigationFeedback.flag', { section: label })}
                      onClick={() => updateSection(section, { flagged: !draft?.flagged })}
                      className={cn(
                        'shrink-0 self-start rounded-xs border px-2 py-1 text-[10.5px] transition-colors sm:self-auto',
                        draft?.flagged
                          ? 'border-critical bg-critical/10 text-critical'
                          : 'border-line-soft text-faint hover:border-line-strong hover:text-muted',
                      )}
                    >
                      {draft?.flagged ? t('navigationFeedback.flagged') : t('navigationFeedback.markWrong')}
                    </button>
                    <Input
                      aria-label={t('navigationFeedback.comment', { section: label })}
                      placeholder={t('navigationFeedback.commentPlaceholder')}
                      className="h-8 px-2 text-[11.5px]"
                      wrapperClassName="flex-1"
                      maxLength={2000}
                      value={draft?.comment ?? ''}
                      onChange={(event) => updateSection(section, { comment: event.target.value })}
                    />
                  </li>
                )
              })}
            </ul>
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

        <Button onClick={() => void handleSubmit()} isLoading={isLoading} disabled={!verdict} className="self-start">
          {existing ? t('feedback.saveChanges') : t('feedback.submit')}
        </Button>
      </div>
    </Card>
  )
}
