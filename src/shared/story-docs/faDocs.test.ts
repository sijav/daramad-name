import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storyNameFromExport } from 'storybook/internal/csf'
import { describe, expect, it } from 'vitest'
import { docSlug, FA_DOCS } from './faDocs'

// The Persian for a Docs page is matched to its story by NAME, across two
// directories, with nothing in the type system holding the two ends together. A
// story renamed on one side and not the other still builds, still renders, and
// still passes every other test — it just quietly serves English to a reader who
// asked for Persian, which is the one failure the whole mechanism exists to
// prevent. So the pairing is asserted here instead.
//
// Display names come from Storybook's own `storyNameFromExport`, not from a
// second implementation of it: the headings on the page are derived with that
// function, so anything else here would be a guess that happens to agree.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../..')

const storyFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return storyFiles(path)
    return entry.name.endsWith('.stories.tsx') ? [path] : []
  })

interface Page {
  title: string
  slug: string
  /** Props the story writes an English `description` for. */
  props: string[]
  /** Display names, as the Docs page prints them. */
  stories: string[]
}

/** The matching `}` for the brace at `open`. */
const closingBrace = (source: string, open: number): number => {
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return source.length - 1
}

/**
 * Read with regexes rather than by importing the story files: they pull in MUI,
 * the lingui macros and the whole component tree, none of which a Node test can
 * load.
 */
const pageOf = (source: string): Page | undefined => {
  const title = /^\s*title: '([^']+)',/m.exec(source)?.[1]
  if (!title) return undefined

  const props: string[] = []
  const argTypesAt = source.indexOf('argTypes: {')
  if (argTypesAt !== -1) {
    const open = source.indexOf('{', argTypesAt + 'argTypes:'.length)
    const block = source.slice(open + 1, closingBrace(source, open))
    const pattern = /^ {4}(\w+): \{([\s\S]*?)\},?$/gm
    let match = pattern.exec(block)
    while (match) {
      if (/description:\s*'/.test(match[2])) props.push(match[1])
      match = pattern.exec(block)
    }
  }

  // Every named export in a CSF file is a story.
  const stories = [...source.matchAll(/^export const (\w+)[:=]/gm)].map((match) => storyNameFromExport(match[1]))

  return { title, slug: docSlug(title), props, stories }
}

const PAGES = storyFiles(SRC)
  .map((path) => pageOf(readFileSync(path, 'utf8')))
  .filter((page): page is Page => Boolean(page))
  .sort((a, b) => a.slug.localeCompare(b.slug))

/**
 * Pages whose prose is translated but whose props and stories are not yet.
 *
 * The translation is being written page by page. This list is what keeps the
 * suite honest in the meantime: a finished page is held to the full standard
 * from the moment it leaves the list, and nothing may be ADDED here — a new
 * story file arrives translated or it fails. See TECH-DEBT.md entry 13.
 *
 * Delete a line as you finish a page. When the list is empty, delete it.
 */
const PENDING = new Set([
  'core-appthemeprovider',
  'core-uselocalesync',
  'core-usesettings',
  'layouts-appshell',
  'pages-certificate',
  'pages-charts',
  'pages-charts-clientsharechart',
  'pages-charts-monthlyincomechart',
  'pages-dashboard',
  'pages-dashboard-recentreceipts',
  'pages-ledger',
  'pages-ledger-editreceiptdialog',
  'pages-ledger-filterpopover',
  'pages-ledger-ledgertable',
  'pages-ledger-pagination',
  'pages-quickentry',
  'pages-quickentry-aside',
  'pages-report',
  'pages-settings',
  'pwa-installappsection',
  'shared-amountfield',
  'shared-apperrorfallback',
  'shared-chartcard',
  'shared-chipselect',
  'shared-confirmdialog',
  'shared-datefield',
  'shared-emptystate',
  'shared-field',
  'shared-filterbutton',
  'shared-filterchip',
  'shared-incomecertificate',
  'shared-insightcallout',
  'shared-ledgerstate',
  'shared-moneytext',
  'shared-numberfield',
  'shared-pageactions',
  'shared-pagecontrol',
  'shared-pageheader',
  'shared-privacyfooter',
  'shared-rangeselect',
  'shared-receiptdetailsdrawer',
  'shared-receiptform',
  'shared-rowactionsmenu',
  'shared-searchfield',
  'shared-segmentedcontrol',
  'shared-settingssection',
  'shared-summarycard',
  'shared-surfacecard',
  'shared-topcustomers',
  'shared-useformat',
  'shared-usereportyear',
])

const TRANSLATED = PAGES.filter((page) => !PENDING.has(page.slug))

/** `slug.key` for everything one side has and the other does not. */
const mismatches = (pick: (page: Page) => string[], section: (slug: string) => Readonly<Record<string, string>>): string[] => {
  const wrong: string[] = []
  for (const page of TRANSLATED) {
    const translated = section(page.slug)
    for (const key of pick(page)) {
      if (!translated[key]) wrong.push(`${page.slug}.${key} — untranslated`)
    }
    for (const key of Object.keys(translated)) {
      if (!pick(page).includes(key)) wrong.push(`${page.slug}.${key} — translated but not in the story`)
    }
  }
  return wrong
}

describe('the Persian Docs pages', () => {
  // A guard on the guard: if the regexes ever stop matching, every assertion
  // below passes over an empty list and proves nothing.
  it('finds the stories', () => {
    expect(PAGES.length).toBeGreaterThan(40)
    expect(PAGES.map((page) => page.slug)).toContain('shared-pageheader')
    expect(PAGES.find((page) => page.slug === 'shared-tag')?.stories).toEqual(['Channel', 'Frozen', 'All Tones'])
  })

  // Prose is the one part every page already has, pending or not.
  it('covers every page', () => {
    expect(PAGES.filter((page) => !FA_DOCS[page.slug]).map((page) => page.slug)).toEqual([])
  })

  // The list is a countdown, not a parking space. A slug that no longer names a
  // story means a page was renamed and quietly lost its exemption along with
  // any hope of the translation being finished.
  it('has no stale entry on the pending list', () => {
    const slugs = new Set(PAGES.map((page) => page.slug))
    expect([...PENDING].filter((slug) => !slugs.has(slug))).toEqual([])
  })

  // Finishing a page means deleting its line, so a page that is done but still
  // listed would go unchecked forever.
  it('has nothing on the pending list that is already finished', () => {
    const finished = PAGES.filter((page) => PENDING.has(page.slug) && Object.keys(FA_DOCS[page.slug]?.stories ?? {}).length > 0)
    expect(finished.map((page) => page.slug)).toEqual([])
  })

  // The other direction: a story deleted or retitled leaves its translation
  // behind, where it is dead weight that reads as coverage.
  it('has no page left over', () => {
    const slugs = new Set(PAGES.map((page) => page.slug))
    expect(Object.keys(FA_DOCS).filter((slug) => !slugs.has(slug))).toEqual([])
  })

  it('translates every documented prop', () => {
    expect(
      mismatches(
        (page) => page.props,
        (slug) => FA_DOCS[slug]?.props ?? {},
      ),
    ).toEqual([])
  })

  it('translates every story description', () => {
    expect(
      mismatches(
        (page) => page.stories,
        (slug) => FA_DOCS[slug]?.stories ?? {},
      ),
    ).toEqual([])
  })

  it('translates every story name', () => {
    expect(
      mismatches(
        (page) => page.stories,
        (slug) => FA_DOCS[slug]?.names ?? {},
      ),
    ).toEqual([])
  })

  it('is Persian, and not empty', () => {
    for (const [slug, doc] of Object.entries(FA_DOCS)) {
      expect(doc.prose.length, slug).toBeGreaterThan(20)
      // A file left holding the English would fail silently otherwise.
      expect(doc.prose, slug).toMatch(/[؀-ۿ]/)
      for (const [key, text] of [...Object.entries(doc.props), ...Object.entries(doc.stories), ...Object.entries(doc.names)]) {
        expect(text, `${slug}.${key}`).toMatch(/[؀-ۿ]/)
      }
    }
  })
})
