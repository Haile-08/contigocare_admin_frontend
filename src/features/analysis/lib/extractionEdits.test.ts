import { describe, expect, it } from 'vitest'

import {
  applyEdits,
  applyHeaderEdits,
  clearEdit,
  countEdits,
  isEditable,
  setEdit,
} from './extractionEdits'
import type { ExtractionGroup } from './policyExtraction'
import type { RunSummaryRow } from './runSummary'

const HEADER: RunSummaryRow[] = [
  { key: 'patient', label: 'runSummary.patient', value: 'PAC-2026-0020' },
  { key: 'insurer', label: 'runSummary.insurer', value: 'GNP' },
  { key: 'urgency', label: 'runSummary.urgency', value: 'CRITICAL' },
  { key: 'runId', label: 'runSummary.runId', value: '20260522_131210' },
  { key: 'generatedAt', label: 'runSummary.generatedAt', value: '2026-05-22 13:12' },
]

const campo = { valor: 'x', confianza: 'alta' as const, evidencia: 'cita' }

function groups(): ExtractionGroup[] {
  return [
    {
      key: 'identification',
      title: 'extraction.groupIdentification',
      rows: [
        { key: 'aseguradora', label: 'extraction.aseguradora', value: 'GNP', campo },
        { key: 'vigencia_inicio', label: 'extraction.vigencia_inicio', value: '30/05/2025', campo },
        { key: 'vigencia_fin', label: 'extraction.vigencia_fin', value: '30/05/2026', campo },
        {
          key: 'periodo',
          label: 'extraction.periodo',
          value: '30/05/2025 - 30/05/2026',
          campo: null,
        },
        { key: 'confianza', label: 'extraction.confidence', value: '82%', campo: null },
      ],
    },
    {
      key: 'financial',
      title: 'extraction.groupFinancial',
      rows: [
        { key: 'deducible', label: 'extraction.deducible', value: '$19,500.00', campo },
        { key: 'copagos', label: 'extraction.copagos', value: '—', campo },
      ],
    },
  ]
}

/** The row as it comes out of `applyEdits`. */
function rowOf(applied: ExtractionGroup[], groupKey: string, rowKey: string) {
  return applied
    .find((group) => group.key === groupKey)
    ?.rows.find((row) => row.key === rowKey)
}

describe('applyEdits', () => {
  it('prints the correction and keeps what the agent extracted', () => {
    const applied = applyEdits(groups(), setEdit({}, 'financial', 'deducible', '$15,000.00'))
    const row = rowOf(applied, 'financial', 'deducible')

    expect(row?.value).toBe('$15,000.00')
    expect(row?.original).toBe('$19,500.00')
    // The quote and the confidence describe the extracted value, and survive
    // the correction — they are how the next reader judges it.
    expect(row?.campo?.evidencia).toBe('cita')
    expect(countEdits(applied)).toBe(1)
  })

  it('does not mark a row the reviewer retyped identically', () => {
    // A value selected, retyped the same and left alone is not a correction,
    // and an asterisk against it in the broker's copy would be a lie.
    const applied = applyEdits(groups(), setEdit({}, 'financial', 'deducible', '  $19,500.00 '))

    expect(rowOf(applied, 'financial', 'deducible')?.original).toBeUndefined()
    expect(countEdits(applied)).toBe(0)
  })

  it('reads an emptied field as a value the document does not state', () => {
    const applied = applyEdits(groups(), setEdit({}, 'financial', 'deducible', '   '))

    expect(rowOf(applied, 'financial', 'deducible')?.value).toBe('—')
    expect(rowOf(applied, 'financial', 'deducible')?.original).toBe('$19,500.00')
  })

  it('fills a field the analysis never found', () => {
    const applied = applyEdits(groups(), setEdit({}, 'financial', 'copagos', '$500 por consulta'))
    const row = rowOf(applied, 'financial', 'copagos')

    expect(row?.value).toBe('$500 por consulta')
    expect(row?.original).toBe('—')
  })

  it('leaves the analysis untouched', () => {
    // The stored run is the answer sheet the eval harness scores against. A
    // correction that reached it would rewrite the question.
    const original = groups()
    const applied = applyEdits(original, setEdit({}, 'financial', 'deducible', '$15,000.00'))

    expect(rowOf(original, 'financial', 'deducible')?.value).toBe('$19,500.00')
    expect(applied).not.toBe(original)
  })

  it('refuses a correction to a row the console derived', () => {
    // The extraction score is a claim about the run, not about the contract.
    const applied = applyEdits(groups(), setEdit({}, 'identification', 'confianza', '99%'))

    expect(rowOf(applied, 'identification', 'confianza')?.value).toBe('82%')
    expect(isEditable('identification', 'confianza')).toBe(false)
    expect(isEditable('identification', 'aseguradora')).toBe(true)
  })

  it('moves the policy period with the coverage date it is printed from', () => {
    // Otherwise the document contradicts itself about when cover began, and
    // the reader has nothing to decide which line to believe.
    const applied = applyEdits(
      groups(),
      setEdit({}, 'identification', 'vigencia_inicio', '30/06/2025'),
    )

    expect(rowOf(applied, 'identification', 'periodo')?.value).toBe('30/06/2025 - 30/05/2026')
    expect(rowOf(applied, 'identification', 'periodo')?.original).toBe('30/05/2025 - 30/05/2026')
    expect(countEdits(applied)).toBe(2)
  })

  it('states one date when the other was cleared', () => {
    const applied = applyEdits(groups(), setEdit({}, 'identification', 'vigencia_fin', ''))

    expect(rowOf(applied, 'identification', 'periodo')?.value).toBe('30/05/2025')
  })
})

describe('clearEdit', () => {
  it('restores the extracted value', () => {
    const edits = setEdit({}, 'financial', 'deducible', '$15,000.00')
    const applied = applyEdits(groups(), clearEdit(edits, 'financial', 'deducible'))

    expect(rowOf(applied, 'financial', 'deducible')?.value).toBe('$19,500.00')
    expect(countEdits(applied)).toBe(0)
  })
})

describe('applyHeaderEdits', () => {
  it('follows the insurer, so the letterhead cannot contradict the table', () => {
    const header = applyHeaderEdits(
      HEADER,
      setEdit({}, 'identification', 'aseguradora', 'Grupo Nacional Provincial'),
    )

    expect(header.find((row) => row.key === 'insurer')?.value).toBe('Grupo Nacional Provincial')
  })

  it('leaves the run’s own identity alone', () => {
    // A run id or a generation date a human can retype is a run nobody can
    // look up afterwards.
    const header = applyHeaderEdits(HEADER, {
      'identification.aseguradora': 'AXA',
      'identification.runId': 'whatever',
    })

    expect(header.find((row) => row.key === 'runId')?.value).toBe('20260522_131210')
    expect(header.find((row) => row.key === 'patient')?.value).toBe('PAC-2026-0020')
    expect(header.find((row) => row.key === 'generatedAt')?.value).toBe('2026-05-22 13:12')
  })
})
