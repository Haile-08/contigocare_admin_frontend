import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import { getApiErrorMessage } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

import { useDeleteAnalysisMutation } from '../api/analysisApi'
import type { DeleteScope, DeletionReceipt } from '../model/types'

interface DeleteAnalysisDialogProps {
  open: boolean
  analysisId: string
  patientId: string
  /** Runs filed under this patient, this one included. */
  patientAnalysisCount: number
  onClose: () => void
  /** Called once the records are gone — the screen showing them has to leave. */
  onDeleted: (receipt: DeletionReceipt) => void
}

/**
 * The erasure confirmation.
 *
 * Two scopes, because "delete this" and "delete everything we hold on this
 * patient" are different requests and an operator asked to erase a patient's
 * data should not have to open four analyses and delete them one at a time.
 * The wider scope is a deliberate second choice, never the default, and it
 * names the number of runs it will take rather than promising "everything" —
 * that number is the only way to notice, before pressing, that the patient id
 * matched more than expected.
 *
 * The dialog is honest about what survives: nothing. The uploaded document was
 * never stored, so a run *is* the redacted policy text, the extracted analysis
 * and the reviewer's verdict, and all three go. There is no soft delete —
 * keeping a hidden row while telling an operator the data was erased is the one
 * outcome this feature must not produce.
 */
export function DeleteAnalysisDialog({
  open,
  analysisId,
  patientId,
  patientAnalysisCount,
  onClose,
  onDeleted,
}: DeleteAnalysisDialogProps) {
  const { t } = useTranslation()
  const [scope, setScope] = useState<DeleteScope>('run')
  const [deleteAnalysis, { isLoading, error, reset }] = useDeleteAnalysisMutation()

  const others = Math.max(0, patientAnalysisCount - 1)

  const close = (): void => {
    // A failure from a previous attempt should not be waiting inside the dialog
    // the next time it opens.
    reset()
    setScope('run')
    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      const receipt = await deleteAnalysis({ analysisId, scope }).unwrap()
      onDeleted(receipt)
    } catch {
      // Surfaced from the mutation's own `error` below.
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('delete.title')}
      description={t('delete.description')}
      confirmLabel={
        scope === 'patient'
          ? t('delete.confirmPatient', { count: String(patientAnalysisCount) })
          : t('delete.confirmRun')
      }
      isLoading={isLoading}
      onConfirm={() => void handleConfirm()}
      onClose={close}
    >
      {others > 0 ? (
        <div
          role="radiogroup"
          aria-label={t('delete.scopeLabel')}
          className="flex flex-col gap-1.5"
        >
          {(['run', 'patient'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={scope === option}
              onClick={() => setScope(option)}
              className={cn(
                'rounded-xs border px-3 py-2 text-left transition-colors',
                scope === option
                  ? 'border-ink bg-surface-sunk'
                  : 'border-line-soft hover:border-line-strong',
              )}
            >
              <span className="block text-[12px] font-medium text-body">
                {option === 'run'
                  ? t('delete.scopeRun')
                  : t('delete.scopePatient', { count: String(patientAnalysisCount) })}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                {option === 'run'
                  ? t('delete.scopeRunHint', { count: String(others) })
                  : t('delete.scopePatientHint', { id: patientId })}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] leading-relaxed text-muted">
          {t('delete.onlyAnalysis', { id: patientId })}
        </p>
      )}

      <Alert tone="warning">{t('delete.irreversible')}</Alert>

      {error ? <Alert tone="error">{getApiErrorMessage(error, t)}</Alert> : null}
    </ConfirmDialog>
  )
}
