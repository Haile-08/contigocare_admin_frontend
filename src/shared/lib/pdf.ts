/**
 * A very small PDF writer, for exporting a report the console already renders.
 *
 * Why hand-rolled rather than a library: the only thing this app exports is a
 * two-column table with a heading, and the smallest PDF library that does that
 * is a few hundred kilobytes of parser, font subsetter and canvas shim shipped
 * to every admin who never presses the button. This is one file, it has no
 * dependencies, and it is deterministic — the same rows produce the same bytes,
 * so the output is testable in the same way the CSV export was.
 *
 * It is deliberately not general. There is one page size, two fonts, no images
 * and no colour beyond greys. Anything that needs more than that should reach
 * for a real library rather than growing this one.
 *
 * **Layout.** Content flows top-down inside a *frame* — an x position and a
 * width — and the frame is what makes multi-column pages possible without the
 * caller computing a single coordinate: set a narrower frame, write, set the
 * next one, write again. `measure` runs a block of writes without emitting
 * anything and reports the height it would take, which is how a caller decides
 * where to break a column before drawing it rather than discovering the
 * overflow afterwards.
 *
 * **Encoding.** Text is written in WinAnsi (Latin-1 for our purposes), which
 * covers Spanish completely — accents, ñ, ¿, the degree sign, the em dash. A
 * character outside it is transliterated where there is an obvious ASCII
 * equivalent and dropped to `?` otherwise, because a PDF that renders a broken
 * glyph in a broker's inbox reads as a broken document, not a missing accent.
 */

/** A4 in PostScript points. */
export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89
export const MARGIN = 56

export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

/**
 * The baseline the page number sits on, and with it anything else in the
 * footer band. Exported so a caller's own footer text lands on the same line
 * rather than a few points off it, which reads as a misprint.
 */
export const FOOTER_BASELINE = PAGE_HEIGHT - 34

/**
 * Helvetica advance widths for ASCII, in 1/1000 em.
 *
 * Only the printable ASCII range is tabulated. Everything above it — the
 * accented Latin-1 letters Spanish actually needs — is close enough to its base
 * letter that one average value does not visibly misplace a line break, and
 * being slightly conservative there costs a few characters per line rather than
 * producing an overflowing one.
 */
const HELVETICA_WIDTHS: readonly number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]

/** The average non-ASCII advance: an accented lowercase letter. */
const FALLBACK_WIDTH = 556

/**
 * The punctuation WinAnsi keeps in `0x80-0x9F`, where Unicode does not.
 *
 * These are exactly the characters this console prints and a naive
 * "code point <= 255" test throws away: the em dash that marks a field the
 * agent did not find, the middle dot in a running header, the curly quotes a
 * word processor leaves inside a pasted clause. Mapping them is the difference
 * between a report reading `Vía de cobertura —` and one reading
 * `Vía de cobertura ?`.
 */
const WINANSI_HIGH: Record<string, number> = {
  '\u20ac': 0x80,
  '\u201a': 0x82,
  '\u0192': 0x83,
  '\u201e': 0x84,
  '\u2026': 0x85,
  '\u2020': 0x86,
  '\u2021': 0x87,
  '\u02c6': 0x88,
  '\u2030': 0x89,
  '\u0160': 0x8a,
  '\u2039': 0x8b,
  '\u0152': 0x8c,
  '\u017d': 0x8e,
  '\u2018': 0x91,
  '\u2019': 0x92,
  '\u201c': 0x93,
  '\u201d': 0x94,
  '\u2022': 0x95,
  '\u2013': 0x96,
  '\u2014': 0x97,
  '\u02dc': 0x98,
  '\u2122': 0x99,
  '\u0161': 0x9a,
  '\u203a': 0x9b,
  '\u0153': 0x9c,
  '\u017e': 0x9e,
  '\u0178': 0x9f,
}

/**
 * Characters WinAnsi genuinely has no glyph for, and what to print instead.
 *
 * None of the current field labels use these, but an exported report renders
 * whatever the policy and the labels happen to contain, and a missing glyph is
 * a blank in a document a broker forwards. Transliterating is cheap insurance.
 */
const TRANSLITERATIONS: Record<string, string> = {
  '\u2192': '->',
  '\u2190': '<-',
  '\u21d2': '=>',
  '\u2265': '>=',
  '\u2264': '<=',
  '\u00a0': ' ',
  '\u2212': '-',
}

export type PdfFont = 'regular' | 'bold'

/** Where a line sits inside the width it was given. */
export type PdfAlign = 'left' | 'right'

/** One line of text on the page. */
interface TextOp {
  text: string
  x: number
  y: number
  size: number
  font: PdfFont
  grey: number
  tracking: number
}

/** A horizontal hairline. */
interface RuleOp {
  x: number
  y: number
  width: number
  grey: number
  weight: number
}

interface Page {
  texts: TextOp[]
  rules: RuleOp[]
}

/**
 * Fold a string into what WinAnsi can print, one char per byte.
 *
 * The result is not valid Unicode text and is not meant to be read as such —
 * each character's code *is* the byte the PDF will contain. That is what lets
 * the builder compute byte offsets from string lengths. Folding twice is the
 * same as folding once, so callers that have already wrapped a string may hand
 * it back in without checking.
 */
export function toWinAnsi(text: string): string {
  let out = ''

  for (const char of text) {
    const winAnsi = WINANSI_HIGH[char]
    if (winAnsi !== undefined) {
      out += String.fromCharCode(winAnsi)
      continue
    }

    const replacement = TRANSLITERATIONS[char]
    if (replacement !== undefined) {
      out += replacement
      continue
    }

    const code = char.codePointAt(0) ?? 63
    out += code <= 0xff ? char : '?'
  }

  return out
}

/**
 * The rendered width of a string at a given size, in points.
 *
 * `tracking` is extra space after every character — the letter-spacing a small
 * uppercase heading needs to stay readable. The PDF applies it after the last
 * character too, which is why it is counted once per character rather than
 * once per gap: the number here has to be the advance the viewer will use, or
 * a right-aligned line lands in the wrong place.
 */
export function textWidth(text: string, size: number, tracking = 0): number {
  let thousandths = 0
  let count = 0

  for (const char of text) {
    const code = char.charCodeAt(0)
    const width =
      code >= 32 && code <= 126 ? (HELVETICA_WIDTHS[code - 32] ?? FALLBACK_WIDTH) : FALLBACK_WIDTH
    thousandths += width
    count += 1
  }

  return (thousandths * size) / 1000 + count * tracking
}

/**
 * Break a string into lines that fit `maxWidth`.
 *
 * Words that are themselves too long — a policy number, a URL — are split
 * rather than allowed to run off the page, because a value truncated at the
 * margin is a value the reader cannot check against their own copy.
 */
export function wrapText(text: string, size: number, maxWidth: number, tracking = 0): string[] {
  const lines: string[] = []
  let current = ''

  const push = (): void => {
    if (current) lines.push(current)
    current = ''
  }

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word

    if (textWidth(candidate, size, tracking) <= maxWidth) {
      current = candidate
      continue
    }

    push()

    if (textWidth(word, size, tracking) <= maxWidth) {
      current = word
      continue
    }

    let chunk = ''
    for (const char of word) {
      if (textWidth(chunk + char, size, tracking) > maxWidth && chunk) {
        lines.push(chunk)
        chunk = ''
      }
      chunk += char
    }
    current = chunk
  }

  push()
  return lines.length > 0 ? lines : ['']
}

/**
 * One line, cut to `maxWidth` with an ellipsis.
 *
 * For the places where wrapping is not an option because the slot is a fixed
 * box — a header cell in a grid. Everywhere else, wrap: a cut value is a value
 * the reader cannot verify, so this is used only where the same fact is stated
 * again in full further down the page.
 */
export function truncate(text: string, size: number, maxWidth: number, tracking = 0): string {
  if (textWidth(text, size, tracking) <= maxWidth) return text

  let out = ''
  for (const char of text) {
    if (textWidth(`${out}${char}…`, size, tracking) > maxWidth) break
    out += char
  }

  return `${out.trimEnd()}…`
}

function escapeText(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

export interface PdfTextOptions {
  size?: number
  font?: PdfFont
  grey?: number
  tracking?: number
  align?: PdfAlign
  /** The box the line is aligned inside. Defaults to the current frame. */
  width?: number
}

export interface PdfRowOptions {
  size?: number
  /** How much of the frame the label may occupy, 0–1. */
  labelRatio?: number
  valueFont?: PdfFont
  valueGrey?: number
  /** A hairline under the row. Off for the last row of a group, which is
   *  closed by the space beneath it instead. */
  divider?: boolean
}

/** Per-page furniture, drawn once the total page count is known. */
export type PdfDecorator = (index: number, total: number) => void

/**
 * Lays out a document top-down and emits the bytes.
 *
 * The cursor moves down the current frame; when it runs past the bottom limit
 * the builder asks `onOverflow` what to do, and starts a new page if nobody
 * answered. Callers describe content, not coordinates — except the absolute
 * `draw*` methods, which exist for the two things a flow cannot express: a grid
 * of cells side by side, and the header and footer that repeat on every page.
 */
export class PdfBuilder {
  private pages: Page[] = []
  private page: Page
  private cursor = MARGIN

  private frameX = MARGIN
  private frameWidth = CONTENT_WIDTH
  private limit = PAGE_HEIGHT - MARGIN

  private measuring = false
  private overflow: (() => void) | null = null
  private decorator: PdfDecorator | null = null

  constructor() {
    this.page = { texts: [], rules: [] }
    this.pages.push(this.page)
  }

  /** The cursor, as a distance from the top of the page. */
  get y(): number {
    return this.cursor
  }

  /** The column content is currently flowing into. */
  frame(x: number, width: number): void {
    this.frameX = x
    this.frameWidth = width
  }

  /** Put the cursor at an absolute height — the top of a new column. */
  moveTo(y: number): void {
    this.cursor = y
  }

  /** The height content may not flow past, leaving the footer its band. */
  bottom(y: number): void {
    this.limit = y
  }

  /** What to do when the current column is full. Defaults to a new page. */
  onOverflow(handler: () => void): void {
    this.overflow = handler
  }

  /** Furniture drawn on every page once the page count is known. */
  decorate(handler: PdfDecorator): void {
    this.decorator = handler
  }

  /** Start a new page. */
  newPage(): void {
    this.page = { texts: [], rules: [] }
    this.pages.push(this.page)
    this.cursor = MARGIN
  }

  /**
   * The height a block of writes would take, without writing it.
   *
   * Page breaks are suspended for the duration, so the answer is the block's
   * natural height rather than whatever it would collapse to against the
   * bottom of this particular column — which is what a caller balancing two
   * columns needs to know. Measuring and drawing run the same code, so the two
   * cannot disagree about how tall a section is.
   */
  measure(draw: () => void): number {
    const page = this.page
    const cursor = this.cursor

    this.measuring = true
    this.page = { texts: [], rules: [] }

    draw()

    const height = this.cursor - cursor

    this.measuring = false
    this.page = page
    this.cursor = cursor

    return height
  }

  /** Reserve vertical space, moving on if it does not fit. */
  private reserve(height: number): void {
    if (this.measuring) return
    if (this.cursor + height <= this.limit) return

    if (this.overflow) this.overflow()
    else this.newPage()
  }

  /** Move the cursor down without drawing anything. */
  space(points: number): void {
    this.cursor += points
  }

  /** One line of text at an absolute position. The baseline is `y`. */
  drawText(text: string, x: number, y: number, options: PdfTextOptions = {}): void {
    const size = options.size ?? 10
    const tracking = options.tracking ?? 0
    const line = toWinAnsi(text)

    const width = options.width ?? this.frameWidth
    const offset =
      options.align === 'right' ? Math.max(0, width - textWidth(line, size, tracking)) : 0

    this.page.texts.push({
      text: line,
      x: x + offset,
      y,
      size,
      font: options.font ?? 'regular',
      grey: options.grey ?? 0,
      tracking,
    })
  }

  /** A hairline at an absolute position. */
  drawRule(x: number, y: number, width: number, grey = 0.75, weight = 0.5): void {
    this.page.rules.push({ x, y, width, grey, weight })
  }

  /**
   * Write a paragraph, wrapped to the frame.
   *
   * @param text The text. Folded to WinAnsi before measuring, so the wrap and
   *   the render agree about how wide it is.
   */
  text(text: string, options: PdfTextOptions & { leading?: number } = {}): void {
    const size = options.size ?? 10
    const tracking = options.tracking ?? 0
    const leading = options.leading ?? size * 1.35

    for (const line of wrapText(toWinAnsi(text), size, this.frameWidth, tracking)) {
      this.reserve(leading)
      this.cursor += leading
      this.drawText(line, this.frameX, this.cursor, { ...options, width: this.frameWidth })
    }
  }

  /** A hairline across the frame. */
  rule(grey = 0.75, weight = 0.5): void {
    this.reserve(6)
    this.cursor += 4
    this.drawRule(this.frameX, this.cursor, this.frameWidth, grey, weight)
    this.cursor += 2
  }

  /**
   * One label/value row of a two-column table.
   *
   * The value is set against the right edge of the frame rather than at a fixed
   * tab stop, so a column of values lines up on the side the eye scans and the
   * label keeps whatever room it needs on the other. Both sides wrap; the whole
   * row moves to the next column together — a label stranded at the foot of one
   * column with its value at the head of the next is how an exported table gets
   * misread.
   */
  row(label: string, value: string, options: PdfRowOptions = {}): void {
    const size = options.size ?? 9.5
    const leading = size * 1.4
    const gutter = 10

    const labelWidth = this.frameWidth * (options.labelRatio ?? 0.52) - gutter
    const valueWidth = this.frameWidth - labelWidth - gutter

    const labelLines = wrapText(toWinAnsi(label), size, labelWidth)
    const valueLines = wrapText(toWinAnsi(value), size, valueWidth)
    const lineCount = Math.max(labelLines.length, valueLines.length)

    this.reserve(lineCount * leading + 4)

    const top = this.cursor

    labelLines.forEach((line, index) => {
      this.drawText(line, this.frameX, top + leading * (index + 1), {
        size,
        grey: 0.42,
        width: labelWidth,
      })
    })

    valueLines.forEach((line, index) => {
      this.drawText(line, this.frameX + this.frameWidth - valueWidth, top + leading * (index + 1), {
        size,
        font: options.valueFont ?? 'bold',
        grey: options.valueGrey ?? 0.1,
        align: 'right',
        width: valueWidth,
      })
    })

    this.cursor = top + lineCount * leading + 2

    if (options.divider !== false) {
      this.drawRule(this.frameX, this.cursor, this.frameWidth, 0.88)
    }

    this.cursor += 2
  }

  /** Serialise one page's drawing operations. */
  private static content(page: Page, index: number, total: number): string {
    const parts: string[] = []

    for (const rule of page.rules) {
      const y = (PAGE_HEIGHT - rule.y).toFixed(2)
      parts.push(
        `${rule.grey} G ${rule.weight} w ${rule.x.toFixed(2)} ${y} m ` +
          `${(rule.x + rule.width).toFixed(2)} ${y} l S`,
      )
    }

    for (const op of page.texts) {
      const font = op.font === 'bold' ? '/F2' : '/F1'
      parts.push(
        `BT ${font} ${op.size} Tf ${op.grey} g ${op.tracking} Tc ` +
          `${op.x.toFixed(2)} ${(PAGE_HEIGHT - op.y).toFixed(2)} Td (${escapeText(op.text)}) Tj ET`,
      )
    }

    // The page number is drawn here rather than by the caller so it cannot be
    // forgotten: a page of a policy report that does not say which page it is
    // stops being evidence the moment it is printed and shuffled.
    const footer = `${index + 1} / ${total}`
    parts.push(
      `BT /F1 8 Tf 0.55 g 0 Tc ` +
        `${(PAGE_WIDTH - MARGIN - textWidth(footer, 8)).toFixed(2)} ` +
        `${(PAGE_HEIGHT - FOOTER_BASELINE).toFixed(2)} Td ` +
        `(${escapeText(footer)}) Tj ET`,
    )

    return parts.join('\n')
  }

  /** Assemble the file. */
  build(): Uint8Array<ArrayBuffer> {
    const pageCount = this.pages.length

    // Furniture last, so it is drawn over the flow rather than under it, and
    // only now — a running "page 2 of 3" cannot be written before the third
    // page exists.
    if (this.decorator) {
      this.pages.forEach((page, index) => {
        this.page = page
        this.decorator?.(index, pageCount)
      })
    }

    const objects: string[] = []

    // 1 catalog, 2 pages, 3 + 4 fonts, then a (page, content) pair each.
    const pageIds = this.pages.map((_, index) => 5 + index * 2)

    objects.push('<< /Type /Catalog /Pages 2 0 R >>')
    objects.push(
      `<< /Type /Pages /Count ${pageCount} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
    )
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
    objects.push(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    )

    this.pages.forEach((page, index) => {
      // Object ids are assigned by position above, so the page object's id is
      // always `5 + index * 2` and its content stream follows it.
      const contentId = 5 + index * 2 + 1
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
      )

      const stream = PdfBuilder.content(page, index, pageCount)
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    })

    let file = '%PDF-1.4\n'
    const offsets: number[] = []

    objects.forEach((body, index) => {
      offsets.push(file.length)
      file += `${index + 1} 0 obj\n${body}\nendobj\n`
    })

    const xrefOffset = file.length
    file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets) {
      file += `${String(offset).padStart(10, '0')} 00000 n \n`
    }
    file +=
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF\n`

    // Every character was written as a single byte: the structure is ASCII and
    // the text was folded to WinAnsi, so byte offsets and string indices agree
    // — which is what makes the xref table above correct.
    const bytes = new Uint8Array(file.length)
    for (let index = 0; index < file.length; index += 1) {
      bytes[index] = file.charCodeAt(index) & 0xff
    }

    return bytes
  }
}
