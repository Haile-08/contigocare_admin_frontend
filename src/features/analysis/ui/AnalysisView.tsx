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
 * One alert and the extraction. The alert is the only thing that outranks the
 * policy terms — a document the agent could not read cleanly changes how much
 * weight the table below deserves, so it is stated before it rather than
 * somewhere inside it.
 *
 * Everything else on the screen is the extraction card. It is the document that
 * leaves the console, and a second rendering of the same terms beside it gave
 * the reader two tables that formatted and qualified the same deducible
 * differently, with nothing on the page saying which one to trust.
 */
export function AnalysisView({ analysis, meta }: AnalysisViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {analysis.notas_calidad_documento ? (
        <Alert tone="warning">{analysis.notas_calidad_documento}</Alert>
      ) : null}

      <PolicyExtractionCard analysis={analysis} meta={meta} />
    </div>
  )
}
