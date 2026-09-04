import { useTranslation } from '@/shared/i18n'
import { Alert } from '@/shared/ui/Alert'

import type { Analisis, AnalysisResult } from '../model/types'
import { PolicyExtractionCard } from './PolicyExtractionCard'

interface AnalysisViewProps {
  analysis: Analisis
  meta: AnalysisResult
}

/**
 * A finished run, as the console shows it.
 *
 * Two alerts and the extraction. The alerts are the only things that outrank the
 * policy terms — a critical finding and a document the agent could not read
 * cleanly both change how much weight the table below deserves, so they are
 * stated before it rather than somewhere inside it.
 *
 * Everything else on the screen is the extraction card. It is the document that
 * leaves the console, and a second rendering of the same terms beside it gave
 * the reader two tables that formatted and qualified the same deducible
 * differently, with nothing on the page saying which one to trust.
 */
export function AnalysisView({ analysis, meta }: AnalysisViewProps) {
  const { t } = useTranslation()

  const criticalFindings = analysis.hallazgos.filter((finding) => finding.severidad === 'critica')

  return (
    <div className="flex flex-col gap-4">
      {criticalFindings.length > 0 ? (
        <Alert tone="error">
          {t('analysis.criticalCount', { count: String(criticalFindings.length) })}
        </Alert>
      ) : null}

      {analysis.notas_calidad_documento ? (
        <Alert tone="warning">{analysis.notas_calidad_documento}</Alert>
      ) : null}

      <PolicyExtractionCard analysis={analysis} meta={meta} />
    </div>
  )
}
