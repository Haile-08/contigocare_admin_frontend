import { useRef } from 'react'
import type { ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { Input, Textarea } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'

import { DocumentUploader } from './DocumentUploader'

interface IntakeSectionProps {
  icon: IconName
  title: string
  description: string
  optional?: boolean
  children: ReactNode
}

/**
 * One block of the intake: what it is on the left, the controls on the right.
 *
 * The explanation sits beside the fields rather than under each of them, so a
 * section with two related fields says once what they are for instead of
 * repeating it in two hints.
 */
function IntakeSection({ icon, title, description, optional, children }: IntakeSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 px-4.5 py-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
      <div className="flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-sunk text-muted">
          <Icon name={icon} className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-body">
            {title}
            {optional ? <Badge>{t('intake.optional')}</Badge> : null}
          </h3>
          <p className="text-[11.5px] leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  )
}

interface AnalysisIntakeStepProps {
  patientId: string
  patientIdError: string | undefined
  knownNames: string
  knownPolicyNumbers: string
  isExtracting: boolean
  onPatientIdChange: (value: string) => void
  onKnownNamesChange: (value: string) => void
  onKnownPolicyNumbersChange: (value: string) => void
  /** Called when the upload is attempted without a patient ID. */
  onMissingPatientId: () => void
  onFile: (file: File) => void
}

/**
 * Step one of the analysis: who it is for, what identifies them, and the policy.
 *
 * The upload is the step's action — choosing a file starts the extraction — so
 * it stays locked until there is a patient ID to file the run under. Locked, it
 * says why, and pressing it takes the operator to the missing field instead of
 * accepting a file it would then refuse.
 */
export function AnalysisIntakeStep({
  patientId,
  patientIdError,
  knownNames,
  knownPolicyNumbers,
  isExtracting,
  onPatientIdChange,
  onKnownNamesChange,
  onKnownPolicyNumbersChange,
  onMissingPatientId,
  onFile,
}: AnalysisIntakeStepProps) {
  const { t } = useTranslation()
  const patientIdRef = useRef<HTMLInputElement>(null)
  const hasPatientId = patientId.trim() !== ''

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="divide-y divide-line-soft">
        <IntakeSection icon="user" title={t('intake.patientSection')} description={t('analysis.patientIdHint')}>
          <Input
            ref={patientIdRef}
            label={t('analysis.patientId')}
            placeholder={t('intake.patientIdPlaceholder')}
            name="patient-id"
            autoComplete="off"
            spellCheck={false}
            required
            autoFocus
            className="h-10 px-3"
            value={patientId}
            maxLength={128}
            error={patientIdError}
            onChange={(event) => onPatientIdChange(event.target.value)}
          />
        </IntakeSection>

        <IntakeSection
          icon="shield"
          title={t('intake.redactionSection')}
          description={t('intake.redactionSectionHint')}
          optional
        >
          {/* Side by side once the drawer is wide enough that one field per row
              would stretch a short list of names across the whole panel. */}
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <Textarea
              label={t('analysis.knownNames')}
              hint={t('analysis.knownNamesHint')}
              name="known-names"
              autoComplete="off"
              spellCheck={false}
              rows={2}
              className="min-h-16 resize-y px-3 py-2"
              value={knownNames}
              maxLength={1000}
              onChange={(event) => onKnownNamesChange(event.target.value)}
            />

            <Input
              label={t('analysis.knownPolicyNumbers')}
              hint={t('analysis.knownPolicyNumbersHint')}
              name="known-policy-numbers"
              autoComplete="off"
              spellCheck={false}
              className="h-10 px-3"
              value={knownPolicyNumbers}
              maxLength={300}
              onChange={(event) => onKnownPolicyNumbersChange(event.target.value)}
            />
          </div>
        </IntakeSection>

        <IntakeSection icon="document" title={t('intake.documentSection')} description={t('intake.documentSectionHint')}>
          <DocumentUploader
            isLoading={isExtracting}
            locked={!hasPatientId}
            onLockedAttempt={() => {
              onMissingPatientId()
              patientIdRef.current?.focus()
            }}
            onSelect={onFile}
          />
        </IntakeSection>
      </Card>
    </div>
  )
}
