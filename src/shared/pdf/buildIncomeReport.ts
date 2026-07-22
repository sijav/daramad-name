import type { Alignment, Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { CertificateModel } from 'src/shared/certificate'

/**
 * The income certificate as a pdfmake document.
 *
 * Every string here comes from `CertificateModel`, the same structure the
 * on-screen document renders. That is deliberate: the two used to keep their
 * own field lists and drifted — the PDF printed national ID, phone and address
 * that the preview never showed, and nobody noticed until someone opened the
 * downloaded file. Content now has one home; only layout lives in the two
 * renderers.
 *
 * KNOWN LIMITATION, kept honest: pdfmake has no bidi implementation. It can
 * shape Arabic-script glyphs but does not reorder runs per visual line, so
 * mixed Persian/Latin text and anything that WRAPS can come out in the wrong
 * word order. Reordering before handing the string over does not fix it,
 * because pdfmake line-breaks afterwards and bidi ordering is per visual line.
 * The `/certificate` print route exists for that reason and is the correct
 * output; this path is kept because it produces a file in one click.
 */
export const buildIncomeReport = (model: CertificateModel): TDocumentDefinitions => {
  const alignment: Alignment = model.direction === 'rtl' ? 'right' : 'left'
  const opposite: Alignment = model.direction === 'rtl' ? 'left' : 'right'

  return {
    pageSize: 'A4',
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: 'Vazirmatn', fontSize: 10, alignment },
    info: { title: model.title, author: model.identity[0]?.value || 'Daramadname' },

    content: [
      {
        columns: [
          [
            { text: model.issuer, style: 'issuer', alignment },
            { text: model.title, style: 'title', alignment },
            { text: model.subtitle, style: 'subtitle', alignment },
          ],
          [
            { text: model.serialLabel, style: 'serialLabel', alignment: opposite },
            { text: model.serial, style: 'serial', alignment: opposite },
          ],
        ],
        columnGap: 16,
      },

      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 1.5 }], margin: [0, 10, 0, 14] },

      ...(model.identity.length > 0 ? [rowTable(model.identity, alignment)] : []),
      rowTable(model.summary, alignment),

      // The total in figures and «به حروف», as every Iranian financial
      // document states it.
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: model.totalLabel, style: 'label' },
              { text: model.totalFigure, style: 'totalFigure', alignment: opposite },
            ],
            ...(model.totalInWords
              ? [
                  [
                    { text: model.totalInWordsLabel, style: 'faint' },
                    { text: model.totalInWords, style: 'words', alignment: opposite },
                  ],
                ]
              : []),
          ],
        },
        layout: 'noBorders',
        margin: [0, 8, 0, 16],
      },

      { text: model.breakdownTitle, style: 'section', alignment },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: model.columns.month, style: 'th' },
              { text: model.columns.count, style: 'th', alignment: opposite },
              { text: model.columns.amount, style: 'th', alignment: opposite },
            ],
            ...model.months.map((row) => [
              { text: row.month, style: 'td' },
              { text: row.count, style: 'td', alignment: opposite },
              { text: row.amount, style: 'td', alignment: opposite },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },

      { text: model.averageBasis, style: 'faint', alignment, margin: [0, 10, 0, 0] },
      { text: model.footnote, style: 'footer', alignment, margin: [0, 18, 0, 0] },
    ],

    styles: {
      issuer: { fontSize: 9, bold: true, color: '#3460d6', margin: [0, 0, 0, 3] },
      title: { fontSize: 19, bold: true },
      subtitle: { fontSize: 9.5, color: '#494b50', margin: [0, 3, 0, 0] },
      serialLabel: { fontSize: 8, color: '#7c7e83' },
      serial: { fontSize: 11, bold: true },
      section: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      label: { fontSize: 10, color: '#494b50' },
      faint: { fontSize: 8.5, color: '#7c7e83' },
      value: { fontSize: 10.5 },
      totalFigure: { fontSize: 16, bold: true },
      words: { fontSize: 9.5, color: '#494b50' },
      th: { fontSize: 9, bold: true, fillColor: '#e9eaec' },
      td: { fontSize: 9.5 },
      footer: { fontSize: 8, color: '#7c7e83', italics: true },
    },
  }
}

const rowTable = (rows: CertificateModel['identity'], alignment: Alignment): Content => ({
  table: {
    widths: ['auto', '*'],
    body: rows.map((row) => [
      { text: row.label, style: 'label' },
      { text: row.value, style: 'value', alignment },
    ]),
  },
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 14],
})
