import type { ReactNode } from 'react'

import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import type { BadgeTone } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'

import {
  APPEAL_HEADERS,
  DOSE_HEADERS,
  MONITORING_HEADERS,
  MONTHLY_HEADERS,
  REAUTH_HEADERS,
  buildSummaryView,
  splitPlaceholders,
} from '../lib/innovadermSummary'
import type { AlertTone, Row, SummaryView } from '../lib/innovadermSummary'
import { agentLabelKey } from '../model/navigation'
import type { NavigationRun } from '../model/navigation'

const URGENCY_TONE: Record<string, BadgeTone> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'positive',
}

const ALERT_TONE: Record<AlertTone, string> = {
  critical: 'border-critical bg-critical-soft text-critical',
  warning: 'border-warning bg-warning-soft text-warning',
  positive: 'border-line-soft bg-positive-soft text-positive',
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="flex flex-col gap-3 px-4.5 pb-4.5">{children}</div>
    </Card>
  )
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="border-b border-line-strong pt-1 pb-1.5 text-[10.5px] font-medium tracking-wide text-faint uppercase">
      {children}
    </h4>
  )
}

function KeyValues({ rows }: { rows: Row[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line-soft py-1.5 last:border-b-0">
          <dt className="shrink-0 text-[11.5px] text-muted">{label}</dt>
          <dd className="min-w-0 text-right text-[12px] wrap-break-word whitespace-pre-wrap text-body">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xs border border-line-soft">
      <table className="w-full border-collapse text-left text-[11.5px]">
        <thead>
          <tr className="bg-ink text-surface">
            {headers.map((header) => (
              <th key={header} className="px-2 py-1.5 font-medium whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={cn(index % 2 === 1 && 'bg-surface-sunk')}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-t border-line-soft px-2 py-1.5 align-top text-body">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-[12px] text-body">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

function Letter({ text }: { text: string }) {
  return (
    <div className="rounded-xs border border-line-soft bg-surface-sunk px-4 py-3 font-mono text-[11.5px] leading-[1.7] text-body">
      {text.split('\n').map((line, index) =>
        line.trim() === '---' ? (
          <hr key={index} className="my-2 border-line-strong" />
        ) : (
          <p key={index} className="min-h-[1.2em] whitespace-pre-wrap">
            {splitPlaceholders(line).map((part, partIndex) =>
              part.placeholder ? (
                <strong key={partIndex} className="text-info">
                  {part.text}
                </strong>
              ) : (
                <span key={partIndex}>{part.text}</span>
              ),
            )}
          </p>
        ),
      )}
    </div>
  )
}

/** The eleven sections of InnovaDerm's coordinator report, as the PDF report prints them. */
function ReportBody({ view }: { view: SummaryView }) {
  return (
    <>
      <Section title="1. Resumen Ejecutivo">
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-body">{view.executiveSummary}</p>
      </Section>

      {view.extraction ? (
        <Section title="2. Extracción de Póliza (Agent 1 — Parser)">
          <KeyValues rows={view.extraction.meta} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 xl:grid-cols-2">
            {view.extraction.groups.map((group) => (
              <section key={group.title}>
                <SubHeading>{group.title}</SubHeading>
                <KeyValues rows={group.rows} />
              </section>
            ))}
          </div>
          {view.extraction.flags.length > 0 ? (
            <section>
              <SubHeading>Banderas de Extracción</SubHeading>
              <ul className="flex flex-col gap-1 text-[12px] text-warning">
                {view.extraction.flags.map((flag) => (
                  <li key={flag}>⚑ {flag}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </Section>
      ) : null}

      <Section title="3. Alertas de Aseguradora">
        {view.alerts.map((alert, index) => (
          <p key={index} className={cn('rounded-xs border-l-2 px-3 py-2 text-[12px] leading-relaxed', ALERT_TONE[alert.tone])}>
            {alert.text}
          </p>
        ))}
      </Section>

      <Section title="4. Fechas Límite">
        <KeyValues rows={view.deadlines} />
      </Section>

      <Section title="5. Plan de Acción (Agent 2 — Planner)">
        {view.steps.map((step) => (
          <article key={step.heading} className="flex flex-col gap-1.5 border-b border-line-soft pb-3 last:border-b-0">
            <h3 className="text-[12.5px] font-medium text-body">{step.heading}</h3>
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-body">{step.action}</p>
            {step.meta ? <p className="text-[11px] font-medium text-info">{step.meta}</p> : null}
            {step.docs.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium text-muted">Documentos requeridos:</p>
                <Bullets items={step.docs} />
              </div>
            ) : null}
            {step.note ? <p className="text-[11.5px] text-muted">{step.note}</p> : null}
          </article>
        ))}
      </Section>

      <Section title="6. Checklist de Documentación">
        {view.checklist.map((group) => (
          <section key={group.title}>
            <SubHeading>{group.title}</SubHeading>
            <ul className="flex flex-col gap-1 text-[12px] text-body">
              {group.items.map((item, index) => (
                <li key={index}>☐ {item}</li>
              ))}
            </ul>
          </section>
        ))}
      </Section>

      <Section title="7. Proyección de Costos (Agent 2)">
        <KeyValues rows={view.costs} />
        {view.optimizationTip ? (
          <p className="text-[12px] text-body">
            <strong className="text-positive">Tip de optimización: </strong>
            {view.optimizationTip}
          </p>
        ) : null}
      </Section>

      {view.roadmap ? (
        <Section title="8. Roadmap Financiero — 12 Meses (Agent 4 — Optimizer)">
          <KeyValues rows={view.roadmap.rows} />
          {view.roadmap.monthly.length > 0 ? (
            <section>
              <SubHeading>Proyección Mensual Detallada</SubHeading>
              <Table headers={MONTHLY_HEADERS} rows={view.roadmap.monthly} />
            </section>
          ) : null}
          {view.roadmap.tips.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SubHeading>Tips de Optimización</SubHeading>
              {view.roadmap.tips.map((tip, index) => (
                <article key={index} className="flex flex-col gap-0.5">
                  <h3 className="text-[12.5px] font-medium text-positive">{tip.title}</h3>
                  <p className="text-[12px] text-body">{tip.action}</p>
                  {tip.meta ? <p className="text-[11px] font-medium text-info">{tip.meta}</p> : null}
                  {tip.risk ? (
                    <p className="text-[11px] text-muted">
                      <strong className="text-critical">Riesgo si se ignora: </strong>
                      {tip.risk}
                    </p>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}
          {view.roadmap.renewal.length > 0 || view.roadmap.tactics.length > 0 ? (
            <section>
              <SubHeading>Proyección de Renovación</SubHeading>
              <KeyValues rows={view.roadmap.renewal} />
              {view.roadmap.tactics.length > 0 ? (
                <>
                  <p className="pt-2 text-[11px] font-medium text-muted">Tácticas de Negociación</p>
                  <Bullets items={view.roadmap.tactics} />
                </>
              ) : null}
            </section>
          ) : null}
        </Section>
      ) : null}

      {view.adherence ? (
        <Section title="9. Adherencia y Monitoreo (Agent 5 — Monitor)">
          <KeyValues rows={view.adherence.metrics} />
          {view.adherence.mostUrgent ? (
            <p className="text-[12px] text-body">
              <strong className="text-critical">Acción más urgente: </strong>
              {view.adherence.mostUrgent.text}
              {view.adherence.mostUrgent.deadline ? (
                <strong className="text-critical"> (fecha límite: {view.adherence.mostUrgent.deadline})</strong>
              ) : null}
            </p>
          ) : null}
          {view.adherence.doses.length > 0 ? (
            <section>
              <SubHeading>Calendario de Dosis</SubHeading>
              <Table headers={DOSE_HEADERS} rows={view.adherence.doses} />
            </section>
          ) : null}
          {view.adherence.monitoring.length > 0 ? (
            <section>
              <SubHeading>Calendario de Monitoreo</SubHeading>
              <Table headers={MONITORING_HEADERS} rows={view.adherence.monitoring} />
            </section>
          ) : null}
          {view.adherence.reauthDocs.length > 0 ? (
            <section>
              <SubHeading>Documentos para Reautorización</SubHeading>
              <Table headers={REAUTH_HEADERS} rows={view.adherence.reauthDocs} />
            </section>
          ) : null}
          {view.adherence.continuityRisk ? (
            <section>
              <SubHeading>Riesgo de continuidad: {view.adherence.continuityRisk.level}</SubHeading>
              <Bullets items={view.adherence.continuityRisk.factors} />
              {view.adherence.continuityRisk.mitigation.length > 0 ? (
                <>
                  <p className="pt-2 text-[11px] font-medium text-positive">Acciones de mitigación:</p>
                  <Bullets items={view.adherence.continuityRisk.mitigation} />
                </>
              ) : null}
            </section>
          ) : null}
          {view.adherence.tips.length > 0 ? (
            <section>
              <SubHeading>Recomendaciones de Adherencia</SubHeading>
              <Bullets items={view.adherence.tips} />
            </section>
          ) : null}
        </Section>
      ) : null}

      {view.appeal ? (
        <Section title="10. Vía de Apelación (Agent 3 — Advocate)">
          {view.appeal.trigger ? (
            <p className="text-[12px] text-body">
              <strong>Activación: </strong>
              {view.appeal.trigger}
            </p>
          ) : null}
          {view.appeal.steps.length > 0 ? <Table headers={APPEAL_HEADERS} rows={view.appeal.steps} /> : null}
          {view.appeal.arguments.length > 0 ? (
            <section>
              <SubHeading>Argumentos Clave</SubHeading>
              <Bullets items={view.appeal.arguments} />
            </section>
          ) : null}
          {view.appeal.timeline ? (
            <p className="text-[12px] text-body">
              <strong className="text-info">Tiempos estimados: </strong>
              {view.appeal.timeline}
            </p>
          ) : null}
        </Section>
      ) : null}

      {view.notificationLetter ? (
        <Section title="11. Carta de Notificación de Siniestro">
          <p className="text-[11.5px] font-medium text-critical">
            INSTRUCCIONES: Imprima esta carta, complete los campos entre corchetes con los datos reales del paciente,
            firme y envíe a la aseguradora. NO modifique el texto legal.
          </p>
          <Letter text={view.notificationLetter} />
        </Section>
      ) : null}

      {view.appealPackage ? (
        <Section title="Paquete de Apelación (Agent 3 — Advocate)">
          {view.appealPackage.error ? <Alert tone="error">{view.appealPackage.error}</Alert> : null}
          {view.appealPackage.privacyWarning ? <Alert tone="warning">{view.appealPackage.privacyWarning}</Alert> : null}
          {view.appealPackage.probability ? (
            <p className="text-[12px] text-body">
              <strong>Probabilidad de éxito: </strong>
              {view.appealPackage.probability}
            </p>
          ) : null}
          {view.appealPackage.letter.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SubHeading>Carta de apelación</SubHeading>
              {view.appealPackage.letter.map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-medium text-muted">{label}</p>
                  <Letter text={value} />
                </div>
              ))}
            </section>
          ) : null}
          {view.appealPackage.condusef ? (
            <section>
              <SubHeading>Queja CONDUSEF</SubHeading>
              <Letter text={view.appealPackage.condusef} />
            </section>
          ) : null}
          {view.appealPackage.arguments.length > 0 ? (
            <section>
              <SubHeading>Argumentos clave</SubHeading>
              <Bullets items={view.appealPackage.arguments} />
            </section>
          ) : null}
          {view.appealPackage.documents.length > 0 ? (
            <section>
              <SubHeading>Documentos adicionales</SubHeading>
              <Bullets items={view.appealPackage.documents} />
            </section>
          ) : null}
          {view.appealPackage.notes ? (
            <p className="text-[12px] whitespace-pre-wrap text-body">{view.appealPackage.notes}</p>
          ) : null}
        </Section>
      ) : null}
    </>
  )
}

/**
 * A finished InnovaDerm navigation, on screen.
 *
 * The body is the coordinator report — the same sections, labels and figures as
 * the PDF the server builds from the same summary. Above it sits what the
 * report cannot say about itself: which agents fell back, and the warnings the
 * coordinator should read before handing anything on.
 */
export function NavigationReport({ run }: { run: NavigationRun }) {
  const { t, fmt } = useTranslation()
  const generatedAt = fmt.date(new Date(run.created_at))
  const view = buildSummaryView(run.result, generatedAt)

  if (!view) return <Alert tone="warning">{t('navigation.legacyRun')}</Alert>

  const urgencyTone = URGENCY_TONE[view.urgency.toLowerCase()] ?? 'neutral'

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="InnovaDerm Navigator — Reporte de Navegación de Cobertura"
          description={t('navigation.ranAt', {
            when: fmt.relative(run.created_at),
            duration: `${Math.round(run.latency_ms / 1000)} s`,
          })}
          action={<Badge tone={urgencyTone}>URGENCIA: {view.urgency.toUpperCase()}</Badge>}
        />
        <div className="px-4.5 pb-4">
          <KeyValues rows={view.cover} />
        </div>
      </Card>

      {run.degraded_agents.length > 0 ? (
        <Alert tone="warning">
          {t('navigation.degraded', {
            agents: run.degraded_agents
              .map((agent) => {
                const key = agentLabelKey(agent)
                return key ? t(key) : agent
              })
              .join(', '),
          })}
        </Alert>
      ) : null}

      {view.warnings.length > 0 ? (
        <Alert tone="warning" title={t('navigation.warningsTitle')}>
          <ul className="list-disc pl-4">
            {view.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <ReportBody view={view} />
    </div>
  )
}
