import { installBidiLayout, toVisualLine } from './bidiText'
import type { CertificateBlock, CertificateDoc } from './buildIncomeReport'

// @types/pdfkit types the module's export as an INSTANCE, but at runtime it is
// the constructor. We describe the construct signature we call, so the loader
// can hand the imported value across without an `any`. `font` is widened to
// allow `false`, which pdfkit accepts to mean "load no default font" — the type
// only lists `string`.
type CertificateDocOptions = Omit<PDFKit.PDFDocumentOptions, 'font'> & { font?: string | false }
export type PdfDocumentConstructor = new (options?: CertificateDocOptions) => PDFKit.PDFDocument

// Draws a `CertificateDoc` onto a pdfkit page and returns the finished file as
// a Blob. pdfkit is a Node library; the loader supplies it and the font bytes,
// and the browser shims (Buffer/stream/zlib/fs) come from the Vite polyfill.
//
// EVERY line of text goes through `writeAt`, which does its own wrapping and
// then reorders each line with `toVisualLine`. pdfkit measures and draws one
// WORD at a time and lays them left to right in the order given, so handing it a
// right-to-left sentence directly prints the words backwards. Wrapping has to
// happen first and reordering second, because bidi order is defined per visual
// line.
//
// The colours are the ones `IncomeCertificate` paints, kept literal on purpose:
// a printed page has no dark mode, and a certificate that inverts because the
// reader had dark mode on is not a document. The two renderers share the same
// `CertificateModel`, so a reader cannot tell which produced the page.

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

export const renderCertificatePdf = (
  PDFDocumentCtor: PdfDocumentConstructor,
  fonts: CertificateFonts,
  cert: CertificateDoc,
): Promise<Blob> => {
  const doc = new PDFDocumentCtor({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 48, right: 48 },
    // Load NO default font. pdfkit otherwise reads Helvetica's AFM metrics off
    // disk with `fs.readFileSync` in its constructor — which has no file to read
    // in the browser and throws "readFileSync of null". We only ever use the
    // embedded Vazirmatn, set explicitly before every draw, so the built-in
    // fonts are never needed. See TECH-DEBT.md — pdfkit in the browser.
    font: false,
    // Compression is left off deliberately: pdfkit's `deflateSync` path is a
    // Node zlib call the browser shim does not implement, and pdfkit already
    // SUBSETS the embedded font, so an uncompressed certificate is still small.
    compress: false,
    info: { Title: cert.title, Author: cert.author },
    lang: cert.direction === 'rtl' ? 'fa-IR' : 'en-US',
  })

  // Buffer is provided by the Vite polyfill in the browser and is native in the
  // Node test runner; either way pdfkit wants font data as a Buffer.
  doc.registerFont('regular', Buffer.from(fonts.regular))
  doc.registerFont('bold', Buffer.from(fonts.bold))

  // Patch the shaper on the font pdfkit ITSELF built, not on our own `fontkit`
  // import. The two are not always the same object: this module imports fontkit
  // as ESM while pdfkit `require`s the CommonJS build, and a bundler that does
  // not dedupe them (Node does not) leaves two separate copies of the Font
  // class. Patching ours would then silently never reach the fonts that draw —
  // which is exactly what happened, and why the Node tests were passing while
  // exercising an unpatched path.
  doc.font('regular')
  const embedded = (doc as unknown as { _font?: { font?: unknown } })._font
  if (embedded?.font) {
    installBidiLayout(embedded.font)
  }

  const x0 = doc.page.margins.left
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const align = cert.align
  const opposite: 'right' | 'left' = align === 'right' ? 'left' : 'right'

  // A single vertical cursor threaded through every block, so nothing depends on
  // pdfkit's own `x`/`y` bookkeeping between calls.
  let y = doc.page.margins.top

  const lineHeight = (size: number) => size * 1.6

  /**
   * Draws text at an explicit y and returns the y just past it.
   *
   * Wraps in LOGICAL order using measured widths, then reorders each resulting
   * line for display. `lineBreak: false` stops pdfkit re-wrapping a line that is
   * already in visual order, which would break it in the wrong place.
   */
  const writeAt = (value: string, atY: number, style: TextStyle): number => {
    doc.font(style.font).fontSize(style.size).fillColor(style.color)

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
    if (lines.length === 0) return atY

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

  /** Same, but advances the shared cursor. */
  const write = (value: string, style: TextStyle): number => {
    y = writeAt(value, y, style)
    return y
  }

  const rule = (color: string, width: number, gapBefore: number, gapAfter: number) => {
    y += gapBefore
    doc
      .moveTo(x0, y)
      .lineTo(x0 + W, y)
      .lineWidth(width)
      .strokeColor(color)
      .stroke()
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
    for (const row of rows) {
      const top = y
      const labelBottom = writeAt(row.label, top, {
        x: labelX,
        w: labelW,
        align,
        font: 'regular',
        size: 10.5,
        color: MUTED,
      })
      const valueBottom = writeAt(row.value, top, { x: valueX, w: valueW, align, font: 'bold', size: 11, color: INK })
      y = Math.max(labelBottom, valueBottom) + 4
      doc
        .moveTo(x0, y - 2)
        .lineTo(x0 + W, y - 2)
        .lineWidth(0.5)
        .strokeColor(HAIRLINE)
        .stroke()
    }
    y += 4
  }

  const drawTotal = (block: Extract<CertificateBlock, { type: 'total' }>) => {
    const top = y
    const padding = 12
    const innerW = W - padding * 2
    const innerTop = top + padding
    const labelBottom = writeAt(block.label, innerTop, {
      x: x0 + padding,
      w: innerW,
      align,
      font: 'regular',
      size: 11,
      color: MUTED,
    })
    const figureBottom = writeAt(block.figure, innerTop, {
      x: x0 + padding,
      w: innerW,
      align: opposite,
      font: 'bold',
      size: 18,
      color: INK,
    })
    let bottom = Math.max(labelBottom, figureBottom)
    if (block.words) {
      const labelEnd = writeAt(block.wordsLabel, bottom + 2, {
        x: x0 + padding,
        w: innerW,
        align,
        font: 'regular',
        size: 9,
        color: FAINT,
      })
      bottom = writeAt(block.words, labelEnd, {
        x: x0 + padding,
        w: innerW,
        align,
        font: 'regular',
        size: 10,
        color: MUTED,
      })
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

    const drawRow = (cells: string[], font: 'regular' | 'bold', size: number, color: string) => {
      const top = y
      let bottom = top
      cells.forEach((cell, index) => {
        const end = writeAt(cell, top, { x: boxX(index), w: cols[index].w, align: cols[index].align, font, size, color })
        bottom = Math.max(bottom, end)
      })
      y = bottom + 2
    }

    drawRow(
      cols.map((c) => c.header),
      'bold',
      9.5,
      MUTED,
    )
    rule(RULE, 1, 0, 4)
    for (const row of block.rows) {
      drawRow(
        cols.map((c) => c.text(row)),
        'regular',
        10,
        INK,
      )
      doc
        .moveTo(x0, y - 1)
        .lineTo(x0 + W, y - 1)
        .lineWidth(0.5)
        .strokeColor(HAIRLINE)
        .stroke()
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
        rule(INK, 1.5, 8, 12)
        break
      case 'rows':
        drawRows(block.rows)
        break
      case 'total':
        drawTotal(block)
        break
      case 'sectionTitle':
        write(block.text, { x: x0, w: W, align, font: 'bold', size: 13, color: INK })
        y += 4
        break
      case 'table':
        drawTable(block)
        break
      case 'note':
        write(block.text, { x: x0, w: W, align, font: 'regular', size: 9, color: FAINT })
        y += 6
        break
    }
  }

  const chunks: Uint8Array[] = []
  return new Promise<Blob>((resolve, reject) => {
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    doc.on('end', () => resolve(new globalThis.Blob(chunks as BlobPart[], { type: 'application/pdf' })))
    doc.on('error', reject)
    doc.end()
  })
}
