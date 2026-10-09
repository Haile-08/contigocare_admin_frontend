import { useState } from 'react'

import { useAnalyzePolicyMutation, useExtractDocumentMutation } from '@/features/analysis/api/analysisApi'
import { applyCorrections } from '@/features/analysis/lib/navigationIntake'
import { AnalysisView } from '@/features/analysis/ui/AnalysisView'
import { AnalysisIntakeStep } from '@/features/analysis/ui/AnalysisIntakeStep'
import { FeedbackPanel } from '@/features/analysis/ui/FeedbackPanel'
import { NavigationPanel } from '@/features/analysis/ui/NavigationPanel'
import { RedactionReview } from '@/features/analysis/ui/RedactionReview'
import type {
  AnalysisResult,
  ExtractedDocument,
  FieldCorrection,
  RedactionSpan,
} from '@/features/analysis/model/types'
import { normalizeApiError } from '@/shared/api/errors'
import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Stepper } from '@/shared/ui/Stepper'

/** The four steps, in order. The index into this is the wizard's whole state machine. */
const STEPS = ['intake', 'redact', 'review', 'navigate'] as const
type Step = (typeof STEPS)[number]

/**
 * The four-step analysis: identify, redact, review, navigate.
 *
 * The fourth step is optional and reads only the stored analysis — by the time
 * it runs the document has already been dropped, so navigating the case can be
 * skipped here and done later from the saved policy with nothing lost.
 *
 * The extracted document lives in **component state**, not in the store and not
 * in the RTK Query cache. That is deliberate. It is the most sensitive thing
 * this app touches, and component state is the only container that is
 * guaranteed to be gone when the component unmounts — a store slice survives
 * that, and a cache entry survives it by design.
 *
 * The consequence is that closing the drawer loses an in-progress review. That
 * is the right trade: the alternative is a policy document sitting in memory
 * behind whatever screen the operator opened next. It is also why the stepper
 * does not offer step three as a destination — there is no state to jump to.
 *
 * The wizard knows nothing about where it is mounted. It reports "the operator
 * is finished with this" through `onClose` and "this run is saved, go look at
 * it" through `onSaved`; the drawer around it decides what those mean.
 */
export function AnalysisWizard({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (analysisId: string) => void
}) {
  const { t } = useTranslation()

  const [step, setStep] = useState<Step>('intake')
  const [patientId, setPatientId] = useState('')
  const [patientIdError, setPatientIdError] = useState<string | undefined>(undefined)
  const [knownNames, setKnownNames] = useState('')
  const [knownPolicyNumbers, setKnownPolicyNumbers] = useState('')
  const [document, setDocument] = useState<ExtractedDocument | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>({})
  const [reviewSaved, setReviewSaved] = useState(false)

  const [extract, { isLoading: isExtracting }] = useExtractDocumentMutation()
  const [analyze, { isLoading: isAnalyzing }] = useAnalyzePolicyMutation()

  const reset = (): void => {
    setStep('intake')
    // The identifying strings go with the document they were typed for.
    setKnownNames('')
    setKnownPolicyNumbers('')
    setDocument(null)
    setAnalysis(null)
    setError(null)
    setCorrections({})
    setReviewSaved(false)
  }

  const handleFile = async (file: File): Promise<void> => {
    if (patientId.trim() === '') {
      setPatientIdError(t('analysis.patientIdRequired'))
      return
    }

    setPatientIdError(undefined)
    setError(null)

    try {
      const extracted = await extract({
        file,
        names: knownNames,
        policyNumbers: knownPolicyNumbers,
      }).unwrap()
      setDocument(extracted)
      setStep('redact')
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
    }
  }

  const handleConfirm = async (approved: RedactionSpan[]): Promise<void> => {
    if (!document) return
    setError(null)

    try {
      const result = await analyze({
        patientId: patientId.trim(),
        document,
        approvedSpans: approved,
      }).unwrap()

      setAnalysis(result)
      // The document is dropped the moment it is no longer needed. Nothing
      // downstream reads it, and holding it would be the one place a policy
      // could linger in this app.
      setDocument(null)
      setStep('review')
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized.messageKey ? t(normalized.messageKey) : normalized.message)
    }
  }

  /** Step three's exit: to the saved policy, which is now a row in the list. */
  const openSaved = (): void => {
    if (analysis) onSaved(analysis.analysis_id)
  }

  const steps = [
    { id: 'intake', label: t('wizard.step1'), hint: t('wizard.step1Hint') },
    { id: 'redact', label: t('wizard.step2'), hint: t('wizard.step2Hint') },
    { id: 'review', label: t('wizard.step3'), hint: t('wizard.step3Hint') },
    { id: 'navigate', label: t('wizard.step4'), hint: t('wizard.step4Hint') },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        {/* Full width on a phone, so the four markers never run under the
            button; beside it from `sm` up. */}
        <Card className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <div className="px-4 py-3">
            <Stepper steps={steps} current={STEPS.indexOf(step)} />
          </div>
        </Card>

        {step === 'intake' ? (
          <Button variant="secondary" className="ml-auto sm:ml-0" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        ) : (
          <Button variant="secondary" className="ml-auto sm:ml-0" onClick={reset}>
            {t('analysis.newAnalysis')}
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* Step 1 — who this is for, and which policy. */}
        {step === 'intake' ? (
          <AnalysisIntakeStep
            patientId={patientId}
            patientIdError={patientIdError}
            knownNames={knownNames}
            knownPolicyNumbers={knownPolicyNumbers}
            isExtracting={isExtracting}
            onPatientIdChange={(value) => {
              setPatientId(value)
              if (patientIdError) setPatientIdError(undefined)
            }}
            onKnownNamesChange={setKnownNames}
            onKnownPolicyNumbersChange={setKnownPolicyNumbers}
            onMissingPatientId={() => setPatientIdError(t('analysis.patientIdRequired'))}
            onFile={(file) => void handleFile(file)}
          />
        ) : null}

        {/* Step 2 — the only point where a human stands between a document and
            a third-party model. */}
        {step === 'redact' && document ? (
          <RedactionReview
            document={document}
            isSubmitting={isAnalyzing}
            onConfirm={(approved) => void handleConfirm(approved)}
            onCancel={reset}
          />
        ) : null}

        {/* Step 3 — the values, then the verdict that turns this run into a
            test case. The run itself was stored the moment the model answered;
            saving here is what attaches the review to it. */}
        {step === 'review' && analysis?.result ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] text-muted">
                {t('analysis.forPatient', { id: analysis.patient_id })}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={openSaved}>
                  {t('wizard.skipReview')}
                </Button>
                <Button variant="secondary" onClick={() => setStep('navigate')}>
                  {t('wizard.continueToNavigation')}
                </Button>
              </div>
            </div>

            <AnalysisView analysis={analysis.result} meta={analysis} />

            {/* Saving keeps the drawer open: the verdict is stored, and the
                operator carries on to the navigator with the corrections. */}
            <FeedbackPanel
              analysisId={analysis.analysis_id}
              analysis={analysis.result}
              submitLabel={t('common.save')}
              onSaved={(saved) => {
                setCorrections(saved)
                setReviewSaved(true)
              }}
            />

            {reviewSaved ? (
              <Button className="self-start" onClick={() => setStep('navigate')}>
                {t('wizard.continueToNavigation')}
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Step 4 — the case: deadlines, plan, costs and letters, built on the
            stored analysis rather than the document. */}
        {step === 'navigate' && analysis?.result ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] text-muted">
                {t('analysis.forPatient', { id: analysis.patient_id })}
              </span>
              <Button variant="ghost" onClick={openSaved}>
                {t('policyDetail.backToList')}
              </Button>
            </div>
            {/* Section A is prefilled from the analysis as the reviewer
                corrected it, and stays editable in the form. */}
            <NavigationPanel
              analysisId={analysis.analysis_id}
              analysis={applyCorrections(analysis.result, corrections)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AnalysisWizard
