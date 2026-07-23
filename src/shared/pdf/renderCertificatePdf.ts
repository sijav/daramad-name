import { msg } from '@lingui/core/macro'
import { i18n } from 'src/core/i18n'
import { installBidiLayout, toVisualLine } from './bidiText'
import type { CertificateBlock, CertificateDoc } from './buildIncomeReport'

// @types/pdfkit types the module's export as an INSTANCE, but at runtime it is
// the constructor. `font` is widened to allow `false`, which pdfkit accepts to
// mean "load no default font"; the type only lists `string`. `_font` is pdfkit's
// private handle on the font last selected by `doc.font()`.
type CertificateDocOptions = Omit<PDFKit.PDFDocumentOptions, 'font'> & { font?: string | false }
export type PdfDocumentConstructor = new (options?: CertificateDocOptions) => PDFKit.PDFDocument & { _font?: { font?: unknown } }

// Draws a `CertificateDoc` onto pdfkit pages and returns the file as a Blob.
// pdfkit is a Node library; the loader supplies it and the font bytes, and the
// browser shims (Buffer/stream/zlib/fs) come from the Vite polyfill.
//
// Every string goes through `writeAt`, which wraps FIRST and reorders each line
// with `toVisualLine` second. Bidi order is defined per visual line, so
// reordering before the break points are known puts words on the wrong lines.
//
// The colours are the ones `IncomeCertificate` paints, kept literal: this is the
// printed document and print has no dark mode.

const INK = '#18191b'
const MUTED = '#494b50'
const FAINT = '#6e7075'
const HAIRLINE = '#e3e5e8'
const RULE = '#c8cbcf'
const BRAND = '#3460d6'

export interface CertificateFonts {
  regular: Uint8Array
  bold: Uint8Array
}

interface TextStyle {
  x: number
  w: number
  align: 'right' | 'left'
  font: 'regular' | 'bold'
  size: number
  color: string
}

/** What wrapping and measuring need. Colour and x do not affect either. */
type TextMetrics = Pick<TextStyle, 'w' | 'font' | 'size'>

export const renderCertificatePdf = (
  PDFDocumentCtor: PdfDocumentConstructor,
  fonts: CertificateFonts,
  cert: CertificateDoc,
): Promise<Blob> => {
  const doc = new PDFDocumentCtor({
    size: cert.pageSize,
    margins: { top: 56, bottom: 56, left: 48, right: 48 },
    // Load NO default font. pdfkit otherwise reads Helvetica's AFM metrics off
    // disk with `fs.readFileSync` in its constructor, which has no file to read
    // in the browser and throws "readFileSync of null". Only the embedded
    // Vazirmatn is ever used. See TECH-DEBT.md 7b.
    font: false,
    // pdfkit's compression path calls Node's `deflateSync`, which the browser
    // zlib shim does not implement. It still subsets the embedded font, so an
    // uncompressed certificate is ~42 KB. See TECH-DEBT.md 7c.
    compress: false,
    info: { Title: cert.title, Author: cert.author },
    lang: cert.direction === 'rtl' ? 'fa-IR' : 'en-US',
  })

  // Buffer comes from the Vite polyfill in the browser and is native in the Node
  // test runner; either way pdfkit wants font data as a Buffer.
  doc.registerFont('regular', Buffer.from(fonts.regular))
  doc.registerFont('bold', Buffer.from(fonts.bold))

  // Patch the shaper on the font pdfkit ITSELF built. `bidiText.ts` imports
  // fontkit as ESM while pdfkit `require`s the CommonJS build, and Node does not
  // dedupe those, so patching only the ESM copy leaves the fonts that actually
  // draw unpatched. `installBidiLayout` patches the prototype and is idempotent,
  // so calling it again here costs nothing.
  doc.font('regular')
  const embedded = doc._font
  if (!embedded?.font) {
    // `_font` is private, so a pdfkit release that renames it turns the patch
    // into a no-op. An unpatched font prints «۱۴۰۵» as «۵۰۴۱» on a page that
    // otherwise looks correct, so throwing is the only signal available.
    throw new Error(i18n._(msg`The report could not be prepared for Persian text. Reload the page and try again.`))
  }
  installBidiLayout(embedded.font)

  const x0 = doc.page.margins.left
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const align = cert.align
  const opposite: 'right' | 'left' = align === 'right' ? 'left' : 'right'

  // One vertical cursor threaded through every block, so nothing depends on
  // pdfkit's own x/y bookkeeping between calls.
  let y = doc.page.margins.top

  const lineHeight = (size: number) => size * 1.6

  /**
   * Starts a new page when `height` would not fit above the bottom margin, and
   * says whether it did.
   *
   * Every block draws at an explicit y with `lineBreak: false`, which keeps
   * pdfkit's own wrapper, the thing that would otherwise add the page, out of
   * it. Without this the cursor just counts down past the paper and the text
   * lands in the file with nothing to render it.
   *
   * A block taller than a whole page is let through rather than looped over: the
   * guard only fires once something has been drawn on the current page.
   */
  const ensureRoom = (height: number): boolean => {
    if (y <= doc.page.margins.top || y + height <= doc.page.height - doc.page.margins.bottom) {
      return false
    }
    doc.addPage()
    y = doc.page.margins.top
    return true
  }

  /** Wraps in LOGICAL order using measured widths. Reordering happens per line, in `writeAt`. */
  const wrap = (value: string, style: TextMetrics): string[] => {
    doc.font(style.font).fontSize(style.size)

    const words = value.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (current && doc.widthOfString(candidate) > style.w) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    if (current) lines.push(current)
    return lines
  }

  /** What `writeAt` is about to consume vertically, measured before it draws. */
  const heightOf = (value: string, style: TextMetrics): number => wrap(value, style).length * lineHeight(style.size)

  /**
   * Draws text at an explicit y and returns the y just past it. `lineBreak: false`
   * stops pdfkit re-wrapping a line that is already in visual order, which would
   * break it in the wrong place.
   */
  const writeAt = (value: string, atY: number, style: TextStyle): number => {
    const lines = wrap(value, style)
    if (lines.length === 0) return atY

    doc.font(style.font).fontSize(style.size).fillColor(style.color)
    const step = lineHeight(style.size)
    lines.forEach((line, index) => {
      doc.text(toVisualLine(line), style.x, atY + index * step, {
        width: style.w,
        align: style.align,
        lineBreak: false,
      })
    })
    return atY + lines.length * step
  }

  /** Same, but advances the shared cursor, breaking the page if it has to. */
  const write = (value: string, style: TextStyle): number => {
    ensureRoom(heightOf(value, style))
    y = writeAt(value, y, style)
    return y
  }

  /** A horizontal line across the text column, at an explicit y. */
  const strokeAcross = (atY: number, color: string, width: number) => {
    doc
      .moveTo(x0, atY)
      .lineTo(x0 + W, atY)
      .lineWidth(width)
      .strokeColor(color)
      .stroke()
  }

  const rule = (color: string, width: number, gapBefore: number, gapAfter: number) => {
    y += gapBefore
    strokeAcross(y, color, width)
    y += gapAfter
  }

  const drawHeader = (block: Extract<CertificateBlock, { type: 'header' }>) => {
    const start = y
    // Serial sits in the opposite top corner; drawn first, then the main block
    // starts back at the same top so the two columns share a baseline.
    const serialW = 150
    const serialX = align === 'right' ? x0 : x0 + W - serialW
    const afterLabel = writeAt(block.serialLabel, start, {
      x: serialX,
      w: serialW,
      align: opposite,
      font: 'regular',
      size: 9,
      color: FAINT,
    })
    writeAt(block.serial, afterLabel, { x: serialX, w: serialW, align: opposite, font: 'bold', size: 12, color: INK })

    const mainW = W - serialW - 16
    const mainX = align === 'right' ? x0 : x0 + serialW + 16
    y = start
    write(block.issuer, { x: mainX, w: mainW, align, font: 'bold', size: 11, color: BRAND })
    write(block.title, { x: mainX, w: mainW, align, font: 'bold', size: 22, color: INK })
    write(block.subtitle, { x: mainX, w: mainW, align, font: 'regular', size: 11, color: MUTED })
  }

  const drawRows = (rows: { label: string; value: string }[]) => {
    const labelW = Math.round(W * 0.32)
    const valueW = W - labelW - 12
    const labelX = align === 'right' ? x0 + W - labelW : x0
    const valueX = align === 'right' ? x0 : x0 + labelW + 12
    const labelStyle: TextStyle = { x: labelX, w: labelW, align, font: 'regular', size: 10.5, color: MUTED }
    const valueStyle: TextStyle = { x: valueX, w: valueW, align, font: 'bold', size: 11, color: INK }
    for (const row of rows) {
      // Break before a row rather than between a label and its value.
      ensureRoom(Math.max(heightOf(row.label, labelStyle), heightOf(row.value, valueStyle)) + 4)
      const top = y
      const labelBottom = writeAt(row.label, top, labelStyle)
      const valueBottom = writeAt(row.value, top, valueStyle)
      y = Math.max(labelBottom, valueBottom) + 4
      strokeAcross(y - 2, HAIRLINE, 0.5)
    }
    y += 4
  }

  const drawTotal = (block: Extract<CertificateBlock, { type: 'total' }>) => {
    const padding = 12
    const innerW = W - padding * 2
    const labelStyle: TextStyle = { x: x0 + padding, w: innerW, align, font: 'regular', size: 11, color: MUTED }
    const figureStyle: TextStyle = { x: x0 + padding, w: innerW, align: opposite, font: 'bold', size: 18, color: INK }
    const wordsLabelStyle: TextStyle = { x: x0 + padding, w: innerW, align, font: 'regular', size: 9, color: FAINT }
    const wordsStyle: TextStyle = { x: x0 + padding, w: innerW, align, font: 'regular', size: 10, color: MUTED }

    // The border is stroked around the finished content, so the box has to be
    // measured whole before anything is drawn, otherwise it can split across
    // sheets and print as half a rounded rectangle.
    let inner = Math.max(heightOf(block.label, labelStyle), heightOf(block.figure, figureStyle))
    if (block.words) {
      inner += 2 + heightOf(block.wordsLabel, wordsLabelStyle) + heightOf(block.words, wordsStyle)
    }
    ensureRoom(inner + padding * 2 + 10)

    const top = y
    const innerTop = top + padding
    const labelBottom = writeAt(block.label, innerTop, labelStyle)
    const figureBottom = writeAt(block.figure, innerTop, figureStyle)
    let bottom = Math.max(labelBottom, figureBottom)
    if (block.words) {
      const labelEnd = writeAt(block.wordsLabel, bottom + 2, wordsLabelStyle)
      bottom = writeAt(block.words, labelEnd, wordsStyle)
    }
    const boxBottom = bottom + padding
    doc
      .roundedRect(x0, top, W, boxBottom - top, 10)
      .lineWidth(1)
      .strokeColor(HAIRLINE)
      .stroke()
    y = boxBottom + 10
  }

  const drawTable = (block: Extract<CertificateBlock, { type: 'table' }>) => {
    const amountW = 190
    const countW = 70
    const monthW = W - amountW - countW
    // Columns in logical order (month, count, amount) laid from the `align` side.
    const cols: { text: (r: (typeof block.rows)[number]) => string; header: string; w: number; align: 'right' | 'left' }[] = [
      { header: block.columns.month, w: monthW, align, text: (r) => r.month },
      { header: block.columns.count, w: countW, align: opposite, text: (r) => r.count },
      { header: block.columns.amount, w: amountW, align: opposite, text: (r) => r.amount },
    ]
    const boxX = (index: number) => {
      let offset = 0
      for (let i = 0; i < index; i += 1) offset += cols[i].w
      return align === 'right' ? x0 + W - offset - cols[index].w : x0 + offset
    }

    const cellMetrics = (index: number, font: 'regular' | 'bold', size: number): TextMetrics => ({ w: cols[index].w, font, size })

    const cellStyle = (index: number, font: 'regular' | 'bold', size: number, color: string): TextStyle => ({
      ...cellMetrics(index, font, size),
      x: boxX(index),
      align: cols[index].align,
      color,
    })

    const rowHeight = (cells: string[], font: 'regular' | 'bold', size: number): number =>
      cells.reduce((tallest, cell, index) => Math.max(tallest, heightOf(cell, cellMetrics(index, font, size))), 0)

    const drawRow = (cells: string[], font: 'regular' | 'bold', size: number, color: string) => {
      const top = y
      let bottom = top
      cells.forEach((cell, index) => {
        bottom = Math.max(bottom, writeAt(cell, top, cellStyle(index, font, size, color)))
      })
      y = bottom + 2
    }

    const headers = cols.map((c) => c.header)
    // Repeated at the top of every sheet the table runs onto: a column of bare
    // amounts with no headings above it cannot be read.
    const drawHead = () => {
      drawRow(headers, 'bold', 9.5, MUTED)
      rule(RULE, 1, 0, 4)
    }
    const headHeight = rowHeight(headers, 'bold', 9.5) + 2 + 4

    // Never open a table with its heading alone at the foot of a page.
    const first = block.rows[0]
    ensureRoom(
      headHeight +
        (first
          ? rowHeight(
              cols.map((c) => c.text(first)),
              'regular',
              10,
            ) + 2
          : 0),
    )
    drawHead()
    for (const row of block.rows) {
      const cells = cols.map((c) => c.text(row))
      if (ensureRoom(rowHeight(cells, 'regular', 10) + 2)) {
        drawHead()
      }
      drawRow(cells, 'regular', 10, INK)
      strokeAcross(y - 1, HAIRLINE, 0.5)
      y += 2
    }
    y += 6
  }

  for (const block of cert.blocks) {
    switch (block.type) {
      case 'header':
        drawHeader(block)
        break
      case 'rule':
        // Carried onto the next sheet rather than stroked below the paper; the
        // rule is what separates two sections.
        ensureRoom(8 + 12)
        rule(INK, 1.5, 8, 12)
        break
      case 'rows':
        drawRows(block.rows)
        break
      case 'total':
        drawTotal(block)
        break
      case 'sectionTitle': {
        const style: TextStyle = { x: x0, w: W, align, font: 'bold', size: 13, color: INK }
        // Keep the heading with at least one line of what it introduces.
        ensureRoom(heightOf(block.text, style) + 4 + lineHeight(10))
        write(block.text, style)
        y += 4
        break
      }
      case 'table':
        drawTable(block)
        break
      case 'note':
        write(block.text, { x: x0, w: W, align, font: 'regular', size: 9, color: FAINT })
        y += 6
        break
    }
  }

  const chunks: BlobPart[] = []
  return new Promise<Blob>((resolve, reject) => {
    // pdfkit emits Node Buffers, which are always backed by a plain ArrayBuffer;
    // `BlobPart` rejects the `ArrayBufferLike` that bare `Uint8Array` implies.
    doc.on('data', (chunk: Uint8Array<ArrayBuffer>) => chunks.push(chunk))
    doc.on('end', () => resolve(new globalThis.Blob(chunks, { type: 'application/pdf' })))
    doc.on('error', reject)
    doc.end()
  })
}
