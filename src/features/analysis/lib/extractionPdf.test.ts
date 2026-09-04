import { describe, expect, it } from 'vitest'

import { balancedSplit, buildExtractionPdf } from './extractionPdf'
import type { ExtractionGroup } from './policyExtraction'
import type { RunSummaryRow } from './runSummary'

function render(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes)
}

/** Every drawn string, joined — so an assertion about a sentence does not have
 *  to know where the layout happened to wrap it. */
function prose(bytes: Uint8Array): string {
  return [...render(bytes).matchAll(/\((.*)\) Tj/g)].map((match) => match[1]).join(' ')
}

const HEADER: RunSummaryRow[] = [
  { key: 'patient', label: 'runSummary.patient', value: 'PAC-2026-0020' },
  { key: 'insurer', label: 'runSummary.insurer', value: 'Grupo Nacional Provincial' },
  { key: 'urgency', label: 'runSummary.urgency', value: 'CRITICAL' },
  { key: 'runId', label: 'runSummary.runId', value: '20260522_131210' },
  { key: 'generatedAt', label: 'runSummary.generatedAt', value: '2026-05-22 13:12' },
]

const GROUPS: ExtractionGroup[] = [
  {
    key: 'identification',
    title: 'extraction.groupIdentification',
    rows: [
      { key: 'aseguradora', label: 'extraction.aseguradora', value: 'GNP', campo: null },
      { key: 'tipo_poliza', label: 'extraction.tipo_poliza', value: '—', campo: null },
    ],
  },
  {
    key: 'financial',
    title: 'extraction.groupFinancial',
    rows: [{ key: 'deducible', label: 'extraction.deducible', value: '$19,500.00', campo: null }],
  },
  // A section a run stored under an older schema never carried. It must not
  // print a heading.
  { key: 'disputes', title: 'extraction.groupDisputes', rows: [] },
]

describe('balancedSplit', () => {
  it('levels the two columns rather than filling the first one', () => {
    // Greedy filling would put all four sections in a column that holds them,
    // leaving the second empty. The even break is after the second.
    expect(balancedSplit([100, 100, 100, 100], 0, 400)).toBe(2)
  })

  it('breaks where the sections are uneven, not where the count is', () => {
    expect(balancedSplit([220, 40, 40, 40], 0, 400)).toBe(1)
  })

  it('forces nothing when the content is taller than two columns', () => {
    const heights = [300, 300, 300]

    expect(balancedSplit(heights, 0, 400)).toBe(heights.length)
  })
})

describe('buildExtractionPdf', () => {
  it('is Spanish whatever language the console is in', () => {
    const file = render(buildExtractionPdf(GROUPS, HEADER))

    expect(file).toContain('(Extracci\xf3n de P\xf3liza) Tj')
    expect(file).toContain('(Deducible) Tj')
    expect(file).not.toContain('(Policy extraction)')
    expect(file).not.toContain('(Deductible)')
  })

  it('states what the document is, above the terms', () => {
    const file = render(buildExtractionPdf(GROUPS, HEADER))

    expect(file).toContain('Los t\xe9rminos que la p\xf3liza establece')
    expect(file).toContain('CONFIDENCIAL')
  })

  it('sets the run it came from as a header band, not as more extracted rows', () => {
    const file = render(buildExtractionPdf(GROUPS, HEADER))

    // The band captions are uppercase; a table row's label is not. If these
    // ever render as sentence case the identity has quietly become data.
    expect(file).toContain('(PACIENTE \\(ID\\)) Tj')
    expect(file).toContain('(PAC-2026-0020) Tj')
  })

  it('drops a group the analysis does not carry rather than heading an empty one', () => {
    const file = render(buildExtractionPdf(GROUPS, HEADER))

    expect(file).toContain('(IDENTIFICACI\xd3N Y ADMINISTRATIVO) Tj')
    expect(file).not.toContain('(DISPUTA Y REGULACI')
  })

  it('marks a corrected value rather than passing it off as extracted', () => {
    const corrected: ExtractionGroup[] = GROUPS.map((group) => ({
      ...group,
      rows: group.rows.map((row) =>
        row.key === 'deducible' ? { ...row, value: '$15,000.00', original: '$19,500.00' } : row,
      ),
    }))

    const bytes = buildExtractionPdf(corrected, HEADER)

    // The asterisk rides the label, not the figure.
    expect(render(bytes)).toContain('(Deducible *) Tj')
    expect(render(bytes)).toContain('(Aseguradora) Tj')
    expect(prose(bytes)).toContain('corregido a mano por el revisor')

    // The standard footer vouches for every value on the page. Once one was
    // typed by hand that sentence is false, and the document must not print it.
    expect(prose(bytes)).toContain('Cada valor no marcado con asterisco es rastreable')
  })

  it('vouches for every value when none was corrected', () => {
    const bytes = buildExtractionPdf(GROUPS, HEADER)

    expect(render(bytes)).not.toContain(' *) Tj')
    expect(prose(bytes)).not.toContain('corregido a mano')
    expect(prose(bytes)).not.toContain('no marcado con asterisco')
    expect(prose(bytes)).toContain('Cada valor es rastreable a una cita en la consola.')
  })

  it('sets the whole extraction on one page, in two columns', () => {
    const file = render(buildExtractionPdf(GROUPS, HEADER))

    expect(/\/Type \/Pages \/Count (\d+)/.exec(file)?.[1]).toBe('1')

    // The second group starts at the second column's x, not the first's.
    const columns = new Set(
      [
        ...file.matchAll(
          /([\d.]+) [\d.]+ Td \((?:IDENTIFICACI\xd3N Y ADMINISTRATIVO|ESTRUCTURA FINANCIERA)\)/g,
        ),
      ].map(
        (match) => match[1],
      ),
    )
    expect(columns.size).toBe(2)
  })
})
