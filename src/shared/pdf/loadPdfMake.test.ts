import { activateLocale } from 'src/core/i18n'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The font pipeline has two ways to be wrong, and neither of them throws where
// you would look for it.
//
// 1. The bytes. Vazirmatn is ~180KB, and `String.fromCharCode(...bytes)`
//    overflows the argument limit, so the encoder walks the file in 32KB
//    chunks. An off-by-one there produces a base64 string that is *valid* —
//    pdfmake accepts it, writes a PDF, and the certificate comes out with
//    unrenderable Persian.
// 2. The names. pdfmake looks the font up by filename in its virtual
//    filesystem, so the keys registered by `addVirtualFileSystem` must be the
//    exact strings `addFonts` points at. A mismatch fails later, at
//    `createPdf`, with "not found in virtual file system".
//
// pdfmake itself is mocked: this is about what we hand it, and the real module
// is a browser bundle with no business running in a node test.

const pdfMakeMock = vi.hoisted(() => ({
  createPdf: vi.fn(),
  addVirtualFileSystem: vi.fn<(vfs: Record<string, string>) => void>(),
  addFonts: vi.fn<(fonts: Record<string, Record<string, string>>) => void>(),
}))

vi.mock('pdfmake/build/pdfmake', () => ({ default: pdfMakeMock }))

/** A stand-in font, deliberately spanning several 32KB chunks plus a partial one. */
const FONT_BYTES = Uint8Array.from({ length: 0x8000 * 2 + 137 }, (_value, index) => (index * 7 + (index >> 8)) % 256)

const okResponse = (bytes: Uint8Array) => ({
  ok: true,
  arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
})

const fetchMock = vi.fn<(url: string) => Promise<unknown>>()

/**
 * `loadPdfMake` memoises its result in a module-level variable, so each case
 * needs a fresh copy of the module — including the failure case, whose rejected
 * promise would otherwise be handed to every later caller.
 */
const freshLoadPdfMake = async () => {
  vi.resetModules()
  const module = await import('./loadPdfMake')
  return module.loadPdfMake
}

beforeAll(async () => {
  // The error message goes through `i18n._`, which throws outright with no
  // active catalog.
  await activateLocale('fa-IR')
})

beforeEach(() => {
  vi.clearAllMocks()
  // Node has no `window`; the loader deliberately reaches through it so both
  // calls stay mockable.
  vi.stubGlobal('window', {
    fetch: fetchMock,
    btoa: (binary: string) => Buffer.from(binary, 'binary').toString('base64'),
  })
})

describe('loadPdfMake — font bytes', () => {
  it('base64-encodes a multi-chunk font exactly', async () => {
    fetchMock.mockResolvedValue(okResponse(FONT_BYTES))
    const loadPdfMake = await freshLoadPdfMake()

    await loadPdfMake()

    const vfs = pdfMakeMock.addVirtualFileSystem.mock.calls[0][0]
    const expected = Buffer.from(FONT_BYTES).toString('base64')
    expect(vfs['Vazirmatn-Regular.ttf']).toBe(expected)
    expect(vfs['Vazirmatn-Bold.ttf']).toBe(expected)
  })

  it('fetches the regular and bold cuts separately, not the same file twice', async () => {
    fetchMock.mockResolvedValue(okResponse(FONT_BYTES))
    const loadPdfMake = await freshLoadPdfMake()

    await loadPdfMake()

    const urls = fetchMock.mock.calls.map(([url]) => url)
    expect(urls).toHaveLength(2)
    expect(new Set(urls).size).toBe(2)
  })
})

describe('loadPdfMake — registration', () => {
  // pdfmake 0.3 resolves a font family to a filename, then that filename to a
  // VFS entry. If the two sets ever drift apart the report page fails at the
  // moment the user clicks download.
  it('registers every filename the font family refers to', async () => {
    fetchMock.mockResolvedValue(okResponse(FONT_BYTES))
    const loadPdfMake = await freshLoadPdfMake()

    await loadPdfMake()

    const vfs = pdfMakeMock.addVirtualFileSystem.mock.calls[0][0]
    const fonts = pdfMakeMock.addFonts.mock.calls[0][0]

    for (const [style, filename] of Object.entries(fonts.Vazirmatn)) {
      expect(Object.keys(vfs), `${style} -> ${filename}`).toContain(filename)
    }
  })

  // Every weight must be declared. pdfmake throws on a missing `italics` slot
  // even though nothing in the certificate is italic.
  it('declares all four pdfmake styles for Vazirmatn', async () => {
    fetchMock.mockResolvedValue(okResponse(FONT_BYTES))
    const loadPdfMake = await freshLoadPdfMake()

    await loadPdfMake()

    expect(Object.keys(pdfMakeMock.addFonts.mock.calls[0][0].Vazirmatn).sort()).toEqual(['bold', 'bolditalics', 'italics', 'normal'])
  })

  // Producing a second report must not re-download 350KB of fonts or re-register
  // them — the promise is cached precisely so the second click is instant.
  it('loads once and reuses the result', async () => {
    fetchMock.mockResolvedValue(okResponse(FONT_BYTES))
    const loadPdfMake = await freshLoadPdfMake()

    const first = await loadPdfMake()
    const second = await loadPdfMake()

    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(pdfMakeMock.addVirtualFileSystem).toHaveBeenCalledTimes(1)
  })
})

describe('loadPdfMake — failure', () => {
  // A font that 404s is the one failure a user can actually hit, and it must
  // arrive as the Persian sentence the report page shows them. Letting the raw
  // `fetch` rejection through would surface "Failed to fetch" — untranslated,
  // unactionable, and in the wrong script.
  it('reports a failed font download in Persian, not as a network error', async () => {
    fetchMock.mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })
    const loadPdfMake = await freshLoadPdfMake()

    await expect(loadPdfMake()).rejects.toThrow('فونت فارسی گزارش بارگذاری نشد. صفحه را دوباره باز کن.')
  })

  it('does not register a half-loaded font set when a fetch fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })
    const loadPdfMake = await freshLoadPdfMake()

    await expect(loadPdfMake()).rejects.toThrow()

    expect(pdfMakeMock.addVirtualFileSystem).not.toHaveBeenCalled()
    expect(pdfMakeMock.addFonts).not.toHaveBeenCalled()
  })
})
