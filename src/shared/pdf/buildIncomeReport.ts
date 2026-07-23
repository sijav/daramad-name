import type { CertificateModel, CertificateMonthRow, CertificateRow } from 'src/shared/certificate'

/**
 * The income certificate as a small, renderer-agnostic layout definition.
 *
 * Every string comes from `CertificateModel`, the structure the on-screen
 * document also renders, so content has one home and only layout lives in the
 * renderers. See `certificateModel.ts` for what that drift cost.
 *
 * A plain block list rather than pdfkit calls, so the layout can be asserted in
 * a Node test with no browser and no PDF engine. `renderCertificatePdf` turns
 * these blocks into the file.
 */
export type CertificateBlock =
  | { type: 'header'; issuer: string; title: string; subtitle: string; serialLabel: string; serial: string }
  | { type: 'rule' }
  | { type: 'rows'; rows: CertificateRow[] }
  | { type: 'total'; label: string; figure: string; wordsLabel: string; words: string }
  | { type: 'sectionTitle'; text: string }
  | { type: 'table'; columns: { month: string; count: string; amount: string }; rows: CertificateMonthRow[] }
  | { type: 'note'; text: string }

export interface CertificateDoc {
  /** A printed page is A4 regardless of the reader's paper. */
  pageSize: 'A4'
  /** The DOCUMENT's direction, not the app's: an English certificate reads LTR. */
  direction: 'rtl' | 'ltr'
  /** Logical alignment for every block, derived once from `direction`. */
  align: 'right' | 'left'
  /** Goes into the PDF's `/Author` metadata. */
  author: string
  /** Goes into the PDF's `/Title` metadata. */
  title: string
  blocks: CertificateBlock[]
}

export const buildIncomeReport = (model: CertificateModel): CertificateDoc => {
  const blocks: CertificateBlock[] = [
    {
      type: 'header',
      issuer: model.issuer,
      title: model.title,
      subtitle: model.subtitle,
      serialLabel: model.serialLabel,
      serial: model.serial,
    },
    { type: 'rule' },
  ]

  // An identity table with no rows is not printed at all, an empty framed
  // section reads as an unfinished form, the one thing this document cannot
  // afford to look like.
  if (model.identity.length > 0) {
    blocks.push({ type: 'rows', rows: model.identity })
  }
  blocks.push({ type: 'rows', rows: model.summary })

  blocks.push({
    type: 'total',
    label: model.totalLabel,
    figure: model.totalFigure,
    // The «به حروف» line is dropped when there are no words (a zero total), so
    // the box never shows a dangling label with nothing beside it.
    wordsLabel: model.totalInWords ? model.totalInWordsLabel : '',
    words: model.totalInWords,
  })

  blocks.push(
    { type: 'sectionTitle', text: model.breakdownTitle },
    { type: 'table', columns: model.columns, rows: model.months },
    { type: 'note', text: model.averageBasis },
    { type: 'note', text: model.footnote },
  )

  return {
    pageSize: 'A4',
    direction: model.direction,
    align: model.direction === 'rtl' ? 'right' : 'left',
    author: model.identity[0]?.value || 'Daramadname',
    title: model.title,
    blocks,
  }
}
