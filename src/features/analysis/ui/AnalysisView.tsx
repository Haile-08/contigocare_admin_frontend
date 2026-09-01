import { useState } from 'react'

import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'

import type {
  Analisis,
  AnalysisResult,
  Campo,
  Confianza,
  Severidad,
} from '../model/types'
import { COBERTURA_FIELD_ORDER, POLIZA_FIELD_ORDER } from '../model/types'
import { RunSummaryCard } from './RunSummaryCard'

/**
 * Dynamic keys are built as explicit maps rather than template strings.
 *
 * `t` is typed against the dictionary, so `t(`field.poliza.${key}`)` only
 * compiles with a cast — and a cast is exactly what would let a renamed key
 * ship as a blank label. Listing them means a rename is a type error.
 */
const CONFIDENCE_LABEL: Record<Confianza, TranslationKey> = {
  alta: 'confidence.alta',
  media: 'confidence.media',
  baja: 'confidence.baja',
  no_encontrado: 'confidence.no_encontrado',
}

const SEVERITY_LABEL: Record<Severidad, TranslationKey> = {
  critica: 'severity.critica',
  alta: 'severity.alta',
  media: 'severity.media',
  informativa: 'severity.informativa',
}

const POLIZA_LABEL: Record<string, TranslationKey> = {
  numero_poliza: 'field.poliza.numero_poliza',
  aseguradora: 'field.poliza.aseguradora',
  nombre_plan: 'field.poliza.nombre_plan',
  ramo: 'field.poliza.ramo',
  moneda: 'field.poliza.moneda',
  vigencia_inicio: 'field.poliza.vigencia_inicio',
  vigencia_fin: 'field.poliza.vigencia_fin',
  fecha_emision: 'field.poliza.fecha_emision',
  antiguedad: 'field.poliza.antiguedad',
  forma_pago: 'field.poliza.forma_pago',
  prima_total: 'field.poliza.prima_total',
  contratante: 'field.poliza.contratante',
  titular: 'field.poliza.titular',
  numero_dependientes: 'field.poliza.numero_dependientes',
}

const COBERTURA_LABEL: Record<string, TranslationKey> = {
  suma_asegurada: 'field.cobertura.suma_asegurada',
  suma_asegurada_por_padecimiento: 'field.cobertura.suma_asegurada_por_padecimiento',
  deducible: 'field.cobertura.deducible',
  coaseguro_porcentaje: 'field.cobertura.coaseguro_porcentaje',
  tope_coaseguro: 'field.cobertura.tope_coaseguro',
  nivel_hospitalario: 'field.cobertura.nivel_hospitalario',
  tabulador_medico: 'field.cobertura.tabulador_medico',
  cobertura_geografica: 'field.cobertura.cobertura_geografica',
  red_hospitalaria: 'field.cobertura.red_hospitalaria',
}

const CONFIDENCE_TONE: Record<Confianza, string> = {
  alta: 'text-positive',
  media: 'text-warning',
  baja: 'text-critical',
  no_encontrado: 'text-faint',
}

const SEVERITY_TONE: Record<Severidad, 'critical' | 'warning' | 'neutral' | 'info'> = {
  critica: 'critical',
  alta: 'warning',
  media: 'neutral',
  informativa: 'info',
}

/** Orders known fields first, then anything the backend added since. */
function orderedEntries(
  section: Record<string, Campo>,
  order: readonly string[],
): Array<[string, Campo]> {
  const known = order.flatMap<[string, Campo]>((key) => {
    const campo = section[key]
    return campo ? [[key, campo]] : []
  })
  const rest = Object.entries(section).filter(([key]) => !order.includes(key))
  return [...known, ...rest]
}

/**
 * One extracted value with its citation.
 *
 * The evidence quote is the point of this component. A deducible with no
 * traceable source is a number someone has to go and verify by hand, which is
 * the work the tool was supposed to remove — so the quote sits one click away
 * from every value, and a field with no quote says so rather than looking
 * identical to one that has been checked.
 */
function FieldRow({ path, campo, label }: { path: string; campo: Campo; label: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const missing = campo.confianza === 'no_encontrado' || !campo.valor

  return (
    <div className="flex flex-col border-b border-line-soft py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="shrink-0 text-[11.5px] text-muted">{label}</dt>
        <dd className="flex min-w-0 items-baseline gap-2 text-right">
          <span
            className={cn(
              'truncate text-[12.5px]',
              missing ? 'text-faint italic' : 'font-medium text-body',
            )}
          >
            {missing ? t('analysis.notFound') : campo.valor}
          </span>
          <span
            title={t(CONFIDENCE_LABEL[campo.confianza])}
            aria-label={t(CONFIDENCE_LABEL[campo.confianza])}
            className={cn('shrink-0 text-[9px]', CONFIDENCE_TONE[campo.confianza])}
          >
            ●
          </span>
        </dd>
      </div>

      {campo.evidencia ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="text-[10.5px] text-faint underline-offset-2 transition-colors hover:text-muted hover:underline"
            aria-expanded={open}
            aria-controls={`${path}-evidence`}
          >
            {open ? t('analysis.hideEvidence') : t('analysis.showEvidence')}
          </button>
        </div>
      ) : null}

      {open && campo.evidencia ? (
        <blockquote
          id={`${path}-evidence`}
          className="mt-1.5 border-l-2 border-line-strong bg-surface-sunk px-2.5 py-1.5 font-mono text-[10.5px] leading-relaxed text-muted"
        >
          {campo.evidencia}
          {campo.pagina ? (
            <footer className="mt-1 text-faint">
              {t('analysis.page', { page: String(campo.pagina) })}
            </footer>
          ) : null}
        </blockquote>
      ) : null}
    </div>
  )
}

interface AnalysisViewProps {
  analysis: Analisis
  meta: AnalysisResult
}

export function AnalysisView({ analysis, meta }: AnalysisViewProps) {
  const { t, locale } = useTranslation()

  // The findings are authored in Spanish and mirrored in English. Which one
  // leads follows the console's language rather than being a separate toggle:
  // one language switch for the whole app is one thing to learn.
  const preferSpanish = locale === 'es'

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

      {/* Which patient, which insurer, which run — above the summary, because
          the summary leaves the console and is worth little unattributed. */}
      <RunSummaryCard analysis={analysis} meta={meta} />

      {/* Summary */}
      <Card>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-medium text-body">{t('analysis.summary')}</h3>
            <Badge tone={analysis.confianza_global === 'alta' ? 'positive' : 'neutral'}>
              {t(CONFIDENCE_LABEL[analysis.confianza_global])}
            </Badge>
          </div>

          <p className="text-[12.5px] leading-[1.6] text-body">
            {preferSpanish ? analysis.resumen_es : analysis.summary_en}
          </p>

          {/* The other language stays reachable rather than being discarded —
              the Spanish is the authoritative wording in a dispute. */}
          {(preferSpanish ? analysis.summary_en : analysis.resumen_es) ? (
            <details className="text-[11.5px] text-muted">
              <summary className="cursor-pointer text-faint transition-colors hover:text-muted">
                {preferSpanish ? t('analysis.showEnglish') : t('analysis.showSpanish')}
              </summary>
              <p className="mt-1.5 leading-[1.6]">
                {preferSpanish ? analysis.summary_en : analysis.resumen_es}
              </p>
            </details>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col p-4">
            <h3 className="mb-1 text-[13px] font-medium text-body">{t('analysis.policyData')}</h3>
            <dl>
              {orderedEntries(analysis.datos_poliza, POLIZA_FIELD_ORDER).map(([key, campo]) => (
                <FieldRow
                  key={key}
                  path={`datos_poliza.${key}`}
                  campo={campo}
                  label={POLIZA_LABEL[key] ? t(POLIZA_LABEL[key]) : key}
                />
              ))}
            </dl>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col p-4">
            <h3 className="mb-1 text-[13px] font-medium text-body">{t('analysis.coverage')}</h3>
            <dl>
              {orderedEntries(analysis.coberturas, COBERTURA_FIELD_ORDER).map(([key, campo]) => (
                <FieldRow
                  key={key}
                  path={`coberturas.${key}`}
                  campo={campo}
                  label={COBERTURA_LABEL[key] ? t(COBERTURA_LABEL[key]) : key}
                />
              ))}
            </dl>
          </div>
        </Card>
      </div>

      {/* Findings */}
      {analysis.hallazgos.length > 0 ? (
        <Card>
          <div className="flex flex-col gap-2.5 p-4">
            <h3 className="text-[13px] font-medium text-body">{t('analysis.findings')}</h3>
            <ul className="flex flex-col gap-2.5">
              {analysis.hallazgos.map((finding, index) => (
                <li
                  key={`${finding.categoria}-${index}`}
                  className="flex gap-2.5 border-l-2 border-line-strong pl-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={SEVERITY_TONE[finding.severidad]}>
                        {t(SEVERITY_LABEL[finding.severidad])}
                      </Badge>
                      <span className="text-[10.5px] tracking-wide text-faint uppercase">
                        {finding.categoria}
                      </span>
                    </div>
                    <p className="text-[12.5px] leading-[1.55] text-body">
                      {preferSpanish ? finding.descripcion_es : finding.description_en}
                    </p>
                    {finding.evidencia ? (
                      <blockquote className="border-l-2 border-line-soft pl-2 font-mono text-[10.5px] leading-relaxed text-faint">
                        {finding.evidencia}
                      </blockquote>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Waiting periods */}
        {analysis.periodos_espera.length > 0 ? (
          <Card>
            <div className="flex flex-col gap-2 p-4">
              <h3 className="text-[13px] font-medium text-body">{t('analysis.waitingPeriods')}</h3>
              <ul className="flex flex-col divide-y divide-line-soft">
                {analysis.periodos_espera.map((period, index) => (
                  <li
                    key={`${period.concepto}-${index}`}
                    className="flex items-baseline justify-between gap-3 py-1.5"
                  >
                    <span className="text-[12px] text-body">{period.concepto}</span>
                    <span className="shrink-0 font-medium text-[12px] text-body">
                      {period.periodo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}

        {/* Benefits */}
        {analysis.beneficios.length > 0 ? (
          <Card>
            <div className="flex flex-col gap-2 p-4">
              <h3 className="text-[13px] font-medium text-body">{t('analysis.benefits')}</h3>
              <ul className="flex flex-col divide-y divide-line-soft">
                {analysis.beneficios.map((benefit, index) => (
                  <li key={`${benefit.nombre}-${index}`} className="flex flex-col gap-0.5 py-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[12px] text-body">
                        {benefit.incluido === true ? (
                          <Icon name="check" className="size-3 text-positive" />
                        ) : benefit.incluido === false ? (
                          <Icon name="close" className="size-3 text-critical" />
                        ) : (
                          <span className="size-3 text-center text-faint">–</span>
                        )}
                        {benefit.nombre}
                      </span>
                      {benefit.suma_asegurada ? (
                        <span className="shrink-0 text-[12px] font-medium text-body">
                          {benefit.suma_asegurada}
                        </span>
                      ) : null}
                    </div>
                    {benefit.condiciones ? (
                      <p className="pl-4.5 text-[11px] text-muted">{benefit.condiciones}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}
      </div>

      {/* Exclusions and pre-existing conditions */}
      {analysis.preexistencias || analysis.exclusiones.length > 0 ? (
        <Card>
          <div className="flex flex-col gap-3 p-4">
            {analysis.preexistencias ? (
              <div className="flex flex-col gap-1">
                <h3 className="text-[13px] font-medium text-body">
                  {t('analysis.preexisting')}
                </h3>
                <p className="text-[12.5px] leading-[1.55] text-body">
                  {analysis.preexistencias}
                </p>
              </div>
            ) : null}

            {analysis.exclusiones.length > 0 ? (
              <details className="flex flex-col gap-1">
                <summary className="cursor-pointer text-[13px] font-medium text-body">
                  {t('analysis.exclusions')}{' '}
                  <span className="text-faint">({analysis.exclusiones.length})</span>
                </summary>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-4">
                  {analysis.exclusiones.map((exclusion, index) => (
                    <li key={index} className="text-[12px] leading-[1.5] text-muted">
                      {exclusion.descripcion}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Provenance. Which model and which prompt produced this is not trivia —
          it is what makes a bad answer attributable later. */}
      <p className="text-[10.5px] text-faint">
        {t('analysis.provenance', {
          model: meta.model_name,
          prompt: meta.prompt_version,
          seconds: (meta.latency_ms / 1000).toFixed(1),
          tokens: String(meta.input_tokens + meta.output_tokens),
        })}
        {meta.self_critique_applied ? ` · ${t('analysis.selfCritiqueApplied')}` : ''}
      </p>
    </div>
  )
}
