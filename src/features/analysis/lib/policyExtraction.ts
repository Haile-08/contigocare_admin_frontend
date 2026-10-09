import type { TranslationKey } from '@/shared/i18n'

import type { Analisis, AnalysisResult, Campo } from '../model/types'
import {
  FINANCIERA_FIELD_ORDER,
  IDENTIFICACION_FIELD_ORDER,
  PREEXISTENCIA_FIELD_ORDER,
} from '../model/types'
import { PLACEHOLDER } from './runSummary'

/**
 * The policy extraction: the values the navigation intake starts from.
 *
 * Built once, in one place, so the screen and the exported PDF read from the
 * same rows. A deductible that renders one way in the console and another way
 * in the broker's copy is worse than no export at all.
 *
 * Three groups, in the order the intake reads them: who the insurer is and when
 * the policy year began, the three figures the cost projection is computed
 * from, and the tenure the pre-existing rules turn on. The navigator's own
 * parser reads everything else from the redacted policy.
 *
 * Everything here is pure. The download lives in the component.
 */

/** A row that came from an extracted field keeps its `Campo`, so the screen can
 *  show the confidence marker and the quote behind it. A row the console
 *  derived (the policy period, the extraction date) has none — and says so by
 *  being `null` rather than by carrying a `Campo` with invented evidence. */
export interface ExtractionRow {
  key: string
  label: TranslationKey
  value: string
  campo: Campo | null
  /** The agent's own value, present only once a reviewer has replaced it. See
   *  `extractionEdits`: a corrected row never loses what was extracted, because
   *  that is the thing the evidence quote and the confidence marker describe. */
  original?: string
}

export interface ExtractionGroup {
  key: string
  title: TranslationKey
  rows: ExtractionRow[]
}

const IDENTIFICACION_LABEL: Record<string, TranslationKey> = {
  aseguradora: 'extraction.aseguradora',
  vigencia_inicio: 'extraction.vigencia_inicio',
}

const FINANCIERA_LABEL: Record<string, TranslationKey> = {
  deducible: 'extraction.deducible',
  coaseguro_porcentaje: 'extraction.coaseguro_porcentaje',
  tope_coaseguro: 'extraction.tope_coaseguro',
}

const PREEXISTENCIA_LABEL: Record<string, TranslationKey> = {
  antiguedad: 'extraction.antiguedad',
}

/** The sections of the analysis that the extraction score is computed over. */
const SCORED_SECTIONS = ['identificacion', 'estructura_financiera', 'preexistencias_continuidad'] as const

/** What one field's confidence is worth. `no_encontrado` is a zero and not an
 *  omission: a field the agent looked for and did not find is evidence about
 *  the extraction, not a gap in the denominator. */
const CONFIDENCE_WEIGHT: Record<string, number> = {
  alta: 1,
  media: 0.6,
  baja: 0.25,
  no_encontrado: 0,
}

function fieldOf(section: Record<string, Campo> | undefined, key: string): Campo | null {
  return section?.[key] ?? null
}

function valueOf(campo: Campo | null): string {
  const value = campo?.valor?.trim()
  return value ? value : PLACEHOLDER
}

function row(
  key: string,
  label: TranslationKey,
  section: Record<string, Campo> | undefined,
): ExtractionRow {
  const campo = fieldOf(section, key)
  return { key, label, value: valueOf(campo), campo }
}

/**
 * Every row of a section, or none of it.
 *
 * The agent answers each of these fields on every run, so a section that
 * arrives empty is not a policy that said nothing — it is a run stored before
 * the field existed. Printing seven dashes for it would state, on a document
 * that gets forwarded, that the contract is silent about direct payment when
 * nobody ever asked. An absent group says less, and less is true.
 */
function rowsFor(
  section: Record<string, Campo> | undefined,
  order: readonly string[],
  labels: Record<string, TranslationKey>,
): ExtractionRow[] {
  if (!section || Object.keys(section).length === 0) return []

  return order.flatMap<ExtractionRow>((key) => {
    const label = labels[key]
    return label ? [row(key, label, section)] : []
  })
}

/**
 * How much of the policy the agent actually read, as a percentage.
 *
 * A single global `alta`/`media` label flattens two very different runs: one
 * where every field was found and quoted, and one where four were found
 * confidently and thirty were not found at all. This weights each field by its
 * own confidence and divides by the number of fields the schema asked for, so
 * a mostly-empty extraction cannot present itself as a confident one.
 *
 * It is a coverage figure, not a probability — it says how much was read, not
 * how likely it is to be right. That is why the agent's own `confianza_global`
 * stays on screen next to it rather than being replaced by this number.
 */
export function extractionScore(analysis: Analisis): number | null {
  let total = 0
  let count = 0

  for (const name of SCORED_SECTIONS) {
    const section = analysis[name]
    for (const campo of Object.values(section)) {
      count += 1
      total += CONFIDENCE_WEIGHT[campo.confianza] ?? 0
    }
  }

  // An analysis with no fields at all is not a 0% extraction, it is an
  // unanswerable question — say nothing rather than print a damning zero.
  if (count === 0) return null

  return Math.round((total / count) * 100)
}

/** The date the run happened, `2026-05-22`, in the reader's own timezone. */
export function extractionDate(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return PLACEHOLDER

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * The extraction, grouped as the report prints it.
 *
 * Rows are emitted even when the field was not found: an empty row is the
 * report saying "the policy is silent on direct payment for drugs", which is a
 * finding a coordinator has to act on. Dropping it would leave the reader
 * unable to tell a silent policy from a section the tool forgot to look at.
 */
export function buildPolicyExtraction(
  analysis: Analisis,
  meta: AnalysisResult,
): ExtractionGroup[] {
  const score = extractionScore(analysis)

  return [
    {
      key: 'identification',
      title: 'extraction.groupIdentification',
      rows: [
        ...rowsFor(analysis.identificacion, IDENTIFICACION_FIELD_ORDER, IDENTIFICACION_LABEL),
        // Derived, so they carry no `Campo`: these describe the run, not the
        // contract, and there is nothing in the policy to quote for them.
        {
          key: 'confianza',
          label: 'extraction.confidence',
          value: score === null ? PLACEHOLDER : `${score}%`,
          campo: null,
        },
        {
          key: 'fechaExtraccion',
          label: 'extraction.extractedAt',
          value: extractionDate(meta.created_at),
          campo: null,
        },
      ],
    },
    {
      key: 'financial',
      title: 'extraction.groupFinancial',
      rows: rowsFor(analysis.estructura_financiera, FINANCIERA_FIELD_ORDER, FINANCIERA_LABEL),
    },
    {
      key: 'preexisting',
      title: 'extraction.groupPreexisting',
      rows: rowsFor(
        analysis.preexistencias_continuidad,
        PREEXISTENCIA_FIELD_ORDER,
        PREEXISTENCIA_LABEL,
      ),
    },
  ]
}
