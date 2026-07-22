import { msg } from '@lingui/core/macro'
import type { TCreatedPdf } from 'pdfmake/build/pdfmake'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { i18n } from 'src/core/i18n'
import vazirBoldUrl from 'vazirmatn/fonts/ttf/Vazirmatn-Bold.ttf?url'
import vazirRegularUrl from 'vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf?url'

// pdfmake with a real embedded Persian font.
//
// The default pdfmake build only carries Roboto, which has no Arabic-script
// glyphs — Persian text renders as blank boxes. So Vazirmatn TTFs are fetched
// from our own origin and registered in pdfmake's virtual filesystem.
//
// These are static asset requests to the app's own bundle, not a network call
// carrying user data: the receipts never leave the browser.

let cached: Promise<PdfMakeModule> | null = null

interface PdfMakeModule {
  createPdf: (definition: TDocumentDefinitions) => TCreatedPdf
  /** pdfmake 0.3 registers VFS entries through these, not by assigning `.vfs`. */
  addVirtualFileSystem: (vfs: Record<string, string>) => void
  addFonts: (fonts: Record<string, Record<string, string>>) => void
}

/** Base64 for pdfmake's VFS, which only accepts base64 strings. */
const fetchAsBase64 = async (url: string): Promise<string> => {
  const response = await window.fetch(url)
  if (!response.ok) {
    throw new Error(i18n._(msg`The report's Persian font failed to load. Reload the page.`))
  }
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Chunked to stay under the argument-count limit on large fonts;
  // `String.fromCharCode(...bytes)` overflows the stack for a ~180KB file.
  let binary = ''
  const CHUNK = 0x8000
  for (let index = 0; index < bytes.length; index += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK))
  }
  return window.btoa(binary)
}

/**
 * Loads pdfmake and registers Vazirmatn. Dynamic `import()` keeps pdfmake out
 * of the initial bundle — it is the largest dependency and only the report page
 * needs it. The result is cached so a second report is instant.
 */
export const loadPdfMake = async (): Promise<PdfMakeModule> => {
  if (!cached) {
    cached = (async () => {
      const [{ default: pdfMake }, regular, bold] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        fetchAsBase64(vazirRegularUrl),
        fetchAsBase64(vazirBoldUrl),
      ])

      const instance = pdfMake as unknown as PdfMakeModule

      // pdfmake 0.3 writes these into an in-memory filesystem; assigning
      // `pdfMake.vfs` directly (the 0.2 API) silently does nothing and fails
      // later with "File 'Vazirmatn-Bold.ttf' not found in virtual file system".
      instance.addVirtualFileSystem({
        'Vazirmatn-Regular.ttf': regular,
        'Vazirmatn-Bold.ttf': bold,
      })

      instance.addFonts({
        Vazirmatn: {
          normal: 'Vazirmatn-Regular.ttf',
          bold: 'Vazirmatn-Bold.ttf',
          italics: 'Vazirmatn-Regular.ttf',
          bolditalics: 'Vazirmatn-Bold.ttf',
        },
      })

      return instance
    })()

    // Forget a FAILED attempt, so a flaky font fetch does not poison the rest
    // of the session. `cached` is assigned before the promise settles, so
    // without this every later call returns the same rejection and the report
    // page keeps refusing long after the network recovered — with no way out
    // but a reload, which throws away the range and profile just filled in.
    cached.catch(() => {
      cached = null
    })
  }

  return cached
}
