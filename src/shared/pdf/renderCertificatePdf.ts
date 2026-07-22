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
    // Turning compression on is a size optimisation, gated on a working
    // browser `deflateSync` — see TECH-DEBT.md.
    compress: false,
    info: { Title: cert.title, Author: cert.author },
    // The document's own language and direction, for a tagged, accessible PDF.
    lang: cert.direction === 'rtl' ? 'fa-IR' : 'en-US',
  })

  // Buffer is provided by the Vite polyfill in the browser and is native in the
  // Node test runner; either way pdfkit wants font data as a Buffer.
  doc.registerFont('regular', Buffer.from(fonts.regular))
  doc.registerFont('bold', Buffer.from(fonts.bold))

  const x0 = doc.page.margins.left
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const align = cert.align
  const opposite: 'right' | 'left' = align === 'right' ? 'left' : 'right'

  // A single vertical cursor threaded through every block, so nothing depends on
  // pdfkit's own `x`/`y` bookkeeping between calls.
  let y = doc.page.margins.top

  const text = (
    value: string,
    opts: { x: number; w: number; align: 'right' | 'left'; font: 'regular' | 'bold'; size: number; color: string },
  ): number => {
    doc.font(opts.font).fontSize(opts.size).fillColor(opts.color)
    doc.text(value, opts.x, y, { width: opts.w, align: opts.align })
    return doc.y
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
    doc.font('regular').fontSize(9).fillColor(FAINT).text(block.serialLabel, serialX, start, { width: serialW, align: opposite })
    doc
      .font('bold')
      .fontSize(12)
      .fillColor(INK)
      .text(block.serial, serialX, doc.y + 2, { width: serialW, align: opposite })

    const mainW = W - serialW - 16
    const mainX = align === 'right' ? x0 : x0 + serialW + 16
    y = start
    y = text(block.issuer, { x: mainX, w: mainW, align, font: 'bold', size: 11, color: BRAND }) + 2
    y = text(block.title, { x: mainX, w: mainW, align, font: 'bold', size: 22, color: INK }) + 2
    y = text(block.subtitle, { x: mainX, w: mainW, align, font: 'regular', size: 11, color: MUTED })
  }

  const drawRows = (rows: { label: string; value: string }[]) => {
    const labelW = Math.round(W * 0.32)
    const valueW = W - labelW - 12
    const labelX = align === 'right' ? x0 + W - labelW : x0
    const valueX = align === 'right' ? x0 : x0 + labelW + 12
    for (const row of rows) {
      const top = y
      doc.font('regular').fontSize(10.5).fillColor(MUTED).text(row.label, labelX, top, { width: labelW, align })
      const labelBottom = doc.y
      doc.font('bold').fontSize(11).fillColor(INK).text(row.value, valueX, top, { width: valueW, align })
      y = Math.max(labelBottom, doc.y) + 6
      doc
        .moveTo(x0, y - 3)
        .lineTo(x0 + W, y - 3)
        .lineWidth(0.5)
        .strokeColor(HAIRLINE)
        .stroke()
    }
    y += 4
  }

  const drawTotal = (block: Extract<CertificateBlock, { type: 'total' }>) => {
    const top = y
    const padding = 12
    const innerTop = top + padding
    doc
      .font('regular')
      .fontSize(11)
      .fillColor(MUTED)
      .text(block.label, x0 + padding, innerTop, { width: W - padding * 2, align })
    const labelBottom = doc.y
    doc
      .font('bold')
      .fontSize(18)
      .fillColor(INK)
      .text(block.figure, x0 + padding, innerTop, { width: W - padding * 2, align: opposite })
    let bottom = Math.max(labelBottom, doc.y)
    if (block.words) {
      const wy = bottom + 4
      doc
        .font('regular')
        .fontSize(9)
        .fillColor(FAINT)
        .text(block.wordsLabel, x0 + padding, wy, { width: W - padding * 2, align })
      doc
        .font('regular')
        .fontSize(10)
        .fillColor(MUTED)
        .text(block.words, x0 + padding, doc.y, { width: W - padding * 2, align })
      bottom = doc.y
    }
    const boxBottom = bottom + padding
    // Draw the tint box UNDER the text: pdfkit paints in call order, so fill
    // first would hide the text. Instead re-draw as a stroked, filled rect
    // behind by using a second pass is overkill — a light outline is enough to
    // frame it without covering the figures already laid down.
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
        doc.font(font).fontSize(size).fillColor(color).text(cell, boxX(index), top, { width: cols[index].w, align: cols[index].align })
        bottom = Math.max(bottom, doc.y)
      })
      y = bottom + 4
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
        .moveTo(x0, y - 2)
        .lineTo(x0 + W, y - 2)
        .lineWidth(0.5)
        .strokeColor(HAIRLINE)
        .stroke()
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
        y = text(block.text, { x: x0, w: W, align, font: 'bold', size: 13, color: INK }) + 6
        break
      case 'table':
        drawTable(block)
        break
      case 'note':
        y = text(block.text, { x: x0, w: W, align, font: 'regular', size: 9, color: FAINT }) + 8
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
