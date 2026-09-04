import { describe, expect, it } from 'vitest'

import { MARGIN, PdfBuilder, textWidth, toWinAnsi, truncate, wrapText } from './pdf'

function render(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes)
}

describe('toWinAnsi', () => {
  it('leaves Spanish alone — it is all inside the encoding', () => {
    expect(toWinAnsi('Programación · Dermatología · ¿Acné?')).toBe(
      'Programación · Dermatología · ¿Acné?',
    )
  })

  it('maps the punctuation WinAnsi keeps in its high range to that byte', () => {
    // The em dash is what a not-found field prints, so this one lands on every
    // report that has a gap in it.
    expect(toWinAnsi('\u2014')).toBe('\x97')
    expect(toWinAnsi('\u201ccobertura\u201d')).toBe('\x93cobertura\x94')
  })

  it('transliterates the characters WinAnsi has no glyph for at all', () => {
    expect(toWinAnsi('Lesiones piel \u2192 2a valoraci\u00f3n')).toBe(
      'Lesiones piel -> 2a valoraci\u00f3n',
    )
    expect(toWinAnsi('\u2265 12 meses')).toBe('>= 12 meses')
  })

  it('falls back to a question mark rather than emitting a broken glyph', () => {
    expect(toWinAnsi('cobertura 🩺')).toBe('cobertura ?')
  })
})

describe('wrapText', () => {
  it('breaks on words that no longer fit', () => {
    const lines = wrapText('arbitraje privado ante persona física designada', 9.5, 90)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) expect(textWidth(line, 9.5)).toBeLessThanOrEqual(90)
  })

  it('splits a single word too long for the column, rather than letting it run off', () => {
    const lines = wrapText('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 10, 60)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) expect(textWidth(line, 10)).toBeLessThanOrEqual(60)
  })

  it('returns one empty line for empty input, so a row still renders', () => {
    expect(wrapText('', 10, 200)).toEqual([''])
  })
})

describe('textWidth', () => {
  it('counts the tracking a letter-spaced heading is set with', () => {
    // A right-aligned line is positioned from this number. If tracking is not
    // in it the line hangs off the edge it was supposed to sit against.
    const plain = textWidth('CONTRATO', 8)

    expect(textWidth('CONTRATO', 8, 1.2)).toBeCloseTo(plain + 8 * 1.2, 5)
  })
})

describe('truncate', () => {
  it('leaves a string that already fits', () => {
    expect(truncate('GNP', 9.5, 100)).toBe('GNP')
  })

  it('cuts to an ellipsis that still fits the box', () => {
    const cut = truncate('Grupo Nacional Provincial', 9.5, 60)

    expect(cut.endsWith('…')).toBe(true)
    expect(textWidth(cut, 9.5)).toBeLessThanOrEqual(60)
  })
})

describe('PdfBuilder', () => {
  it('writes a file a reader will accept: header, xref and trailer', () => {
    const pdf = new PdfBuilder()
    pdf.text('Extracción de Póliza', { size: 17, font: 'bold' })
    pdf.row('Deducible', '$19,500.00')

    const file = render(pdf.build())

    expect(file.startsWith('%PDF-1.4\n')).toBe(true)
    expect(file.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(file).toContain('/Type /Catalog')
    expect(file).toContain('/BaseFont /Helvetica-Bold')
    expect(file).toContain('/Encoding /WinAnsiEncoding')
    expect(file).toContain('(Deducible) Tj')
  })

  it('points every xref entry at the object it claims to', () => {
    const pdf = new PdfBuilder()
    pdf.text('one')
    const file = render(pdf.build())

    const startxref = Number(/startxref\n(\d+)/.exec(file)?.[1])
    expect(file.slice(startxref, startxref + 4)).toBe('xref')

    // The offsets are what a reader seeks to. If they are wrong by a byte the
    // file still looks fine in a text editor and opens in nothing.
    const offsets = [...file.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]))
    expect(offsets).toHaveLength(6)
    offsets.forEach((offset, index) => {
      expect(file.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true)
    })
  })

  it('breaks to a second page rather than writing past the bottom margin', () => {
    const pdf = new PdfBuilder()
    for (let index = 0; index < 90; index += 1) {
      pdf.row(`Campo ${index}`, `Valor ${index}`)
    }

    const file = render(pdf.build())

    expect(/\/Type \/Pages \/Count (\d+)/.exec(file)?.[1]).not.toBe('1')
    expect(file).toContain('(1 / ')
    expect(file).toContain('(2 / ')
  })

  it('escapes the parentheses and backslashes that would end a string early', () => {
    const pdf = new PdfBuilder()
    pdf.row('Coaseguro (%)', 'GNP \\ (Grupo)')

    const file = render(pdf.build())

    expect(file).toContain('(Coaseguro \\(%\\)) Tj')
    expect(file).toContain('(GNP \\\\ \\(Grupo\\)) Tj')
  })

  it('writes into the frame it was given, so columns land side by side', () => {
    const pdf = new PdfBuilder()

    pdf.frame(MARGIN, 200)
    pdf.text('izquierda')
    pdf.frame(MARGIN + 240, 200)
    pdf.text('derecha')

    const file = render(pdf.build())
    const x = (text: string): number =>
      Number(new RegExp(`([\\d.]+) [\\d.]+ Td \\(${text}\\)`).exec(file)?.[1])

    expect(x('izquierda')).toBeCloseTo(MARGIN, 2)
    expect(x('derecha')).toBeCloseTo(MARGIN + 240, 2)
  })

  it('measures a block without drawing it or moving the cursor', () => {
    const pdf = new PdfBuilder()
    const before = pdf.y

    const height = pdf.measure(() => {
      pdf.text('DERMATOLOGÍA', { size: 8 })
      pdf.row('Acné excluido', 'Sí')
    })

    expect(height).toBeGreaterThan(0)
    expect(pdf.y).toBe(before)

    // The point of measuring is that it costs nothing: a block that measured
    // and then also printed would double every heading on the page.
    expect(render(pdf.build())).not.toContain('(Acn')
  })

  it('measures the natural height, ignoring the bottom it would have hit', () => {
    const pdf = new PdfBuilder()
    pdf.bottom(pdf.y + 10)

    let broke = false
    pdf.onOverflow(() => {
      broke = true
    })

    const height = pdf.measure(() => {
      for (let index = 0; index < 8; index += 1) pdf.row(`Campo ${index}`, 'Sí')
    })

    expect(broke).toBe(false)
    expect(height).toBeGreaterThan(10)
  })

  it('hands a full column to onOverflow instead of starting a page itself', () => {
    const pdf = new PdfBuilder()
    pdf.bottom(pdf.y + 30)

    let moved = 0
    pdf.onOverflow(() => {
      moved += 1
      pdf.frame(MARGIN + 240, 200)
      pdf.moveTo(MARGIN)
    })

    for (let index = 0; index < 6; index += 1) pdf.row(`Campo ${index}`, 'Sí')

    const file = render(pdf.build())

    expect(moved).toBeGreaterThan(0)
    expect(/\/Type \/Pages \/Count (\d+)/.exec(file)?.[1]).toBe('1')
  })

  it('declares a stream length that matches the stream it wrote', () => {
    const pdf = new PdfBuilder()
    pdf.text('Extracción de Póliza — GNP')
    pdf.row('Periodo de póliza', '30/05/2025 - 30/05/2026')

    const file = render(pdf.build())
    const match = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(file)

    expect(match).not.toBeNull()
    expect(match?.[2]?.length).toBe(Number(match?.[1]))
  })
})
