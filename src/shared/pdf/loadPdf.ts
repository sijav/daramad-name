import { msg } from '@lingui/core/macro'
import { i18n } from 'src/core/i18n'
import type { CertificateModel } from 'src/shared/certificate'
import vazirBoldUrl from 'vazirmatn/fonts/ttf/Vazirmatn-Bold.ttf?url'
import vazirRegularUrl from 'vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf?url'
import { buildIncomeReport } from './buildIncomeReport'
import { type PdfDocumentConstructor, renderCertificatePdf } from './renderCertificatePdf'

// The report certificate, drawn with pdfkit and a real embedded Persian font.
//
// pdfkit is loaded with a dynamic `import()` so it and its Node shims stay out
// of the initial bundle, only the report page pays for them. Vazirmatn is
// fetched from the app's own origin (a static asset request, not a network call
// carrying user data, the receipts never leave the browser) because the
// default PDF fonts carry no Arabic-script glyphs and Persian would render as
// empty boxes.
//
// Before anything is drawn, `installBidiLayout` patches fontkit's `layout` so
// mixed Persian text, an RTL word beside Persian digits, is reordered by the
// real Unicode bidi algorithm instead of blindly reversed. Without it ۱۴۰۵ would
// print as ۵۰۴۱. See `bidiText.ts`.

export interface CertificateRenderer {
  createCertificate: (model: CertificateModel) => Promise<Blob>
}

let cached: Promise<CertificateRenderer> | null = null

const fetchBytes = async (url: string): Promise<Uint8Array> => {
  const response = await window.fetch(url)
  if (!response.ok) {
    throw new Error(i18n._(msg`The report's Persian font failed to load. Reload the page.`))
  }
  return new Uint8Array(await response.arrayBuffer())
}

export const loadPdf = async (): Promise<CertificateRenderer> => {
  if (!cached) {
    cached = (async () => {
      const [{ default: PDFDocument }, { installBidiLayout, fontkit }, regular, bold] = await Promise.all([
        import('pdfkit'),
        import('./bidiText'),
        fetchBytes(vazirRegularUrl),
        fetchBytes(vazirBoldUrl),
      ])

      // Patch the shared fontkit prototype once, using a probe font. pdfkit
      // creates its own fontkit fonts from the same module, so the patch reaches
      // them too.
      installBidiLayout(fontkit.create(Buffer.from(regular)))

      // @types/pdfkit types the default export as an instance; at runtime it is
      // the constructor renderCertificatePdf calls.
      const PdfCtor = PDFDocument as unknown as PdfDocumentConstructor

      return {
        createCertificate: (model: CertificateModel) => renderCertificatePdf(PdfCtor, { regular, bold }, buildIncomeReport(model)),
      }
    })()

    // Forget a FAILED attempt so a flaky font fetch does not poison the session:
    // `cached` is assigned before the promise settles, so without this every
    // later call replays the same rejection with no way out but a reload, which
    // throws away the range and profile just filled in.
    cached.catch(() => {
      cached = null
    })
  }

  return cached
}
