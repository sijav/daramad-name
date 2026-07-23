import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storyNameFromExport } from 'storybook/internal/csf'
import { describe, expect, it } from 'vitest'
import { docSlug, EN_DOCS, FA_DOCS } from './storyDocs'

// Documentation lives in markdown keyed by story title and prop name, with
// nothing in the type system holding it to the code it describes. A story
// renamed on one side still builds, still renders, and still passes every other
// test, it just quietly loses its description. So the pairing is asserted here.
//
// Display names come from Storybook's own `storyNameFromExport` rather than a
// second implementation of it: the headings are derived with that function, so
// anything else would be a guess that happens to agree.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../..')

const storyFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return storyFiles(path)
    return entry.name.endsWith('.stories.tsx') ? [path] : []
  })

interface Page {
  slug: string
  stories: string[]
}

/**
 * Read with a regex rather than by importing the story file: they pull in MUI,
 * the lingui macros and the whole component tree, none of which a Node test can
 * load.
 */
const pageOf = (source: string): Page | undefined => {
  const title = /^\s*title: '([^']+)',/m.exec(source)?.[1]
  if (!title) return undefined
  // Every named export in a CSF file is a story.
  const stories = [...source.matchAll(/^export const (\w+)[:=]/gm)].map((match) => storyNameFromExport(match[1]))
  return { slug: docSlug(title), stories }
}

const SOURCES = storyFiles(SRC).map((path) => ({ path, source: readFileSync(path, 'utf8') }))

const PAGES = SOURCES.map(({ source }) => pageOf(source))
  .filter((page): page is Page => Boolean(page))
  .sort((a, b) => a.slug.localeCompare(b.slug))

/** The `argTypes` object literal, by brace matching, or '' when there is none. */
const argTypesBlock = (source: string): string => {
  const start = source.indexOf('argTypes: {')
  if (start === -1) return ''
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}' && (depth -= 1) === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

// A prop's own `description` entry is fine (`description: { control: 'text' }`);
// what is banned is prose assigned to one, which is documentation in code.
const PROSE = /\bdescription:\s*\n?\s*['"`]/

describe('the Storybook documentation', () => {
  // A guard on the guard: if the regex stops matching, every assertion below
  // passes over an empty list and proves nothing.
  it('finds the stories', () => {
    expect(PAGES.length).toBeGreaterThan(40)
    expect(PAGES.find((page) => page.slug === 'shared-tag')?.stories).toEqual(['Channel', 'Frozen', 'All Tones'])
  })

  // AGENTS.md: no `description:` inside `argTypes`. A prop documented in code
  // renders the same English text on the Persian page, because `LocalizedDocs`
  // swaps descriptions in from markdown and has nothing to swap.
  it('keeps prop descriptions out of the code', () => {
    const offenders = SOURCES.filter(({ source }) => PROSE.test(argTypesBlock(source))).map(({ path }) => path.replace(SRC, 'src'))
    expect(offenders).toEqual([])
  })

  // The check above reads an empty string when the brace matching fails, and an
  // empty string never matches, so prove it fires on a planted case.
  it('would catch a description in argTypes', () => {
    const planted = `const meta = {\n  argTypes: {\n    limit: { control: { type: 'number' } },\n    label: { description: 'prose' },\n  },\n}`
    expect(PROSE.test(argTypesBlock(planted))).toBe(true)
    expect(argTypesBlock(planted)).toContain('limit')
  })

  it('has an English file for every page', () => {
    expect(PAGES.filter((page) => !EN_DOCS[page.slug]).map((page) => page.slug)).toEqual([])
  })

  it('has a Persian file for every page', () => {
    expect(PAGES.filter((page) => !FA_DOCS[page.slug]).map((page) => page.slug)).toEqual([])
  })

  // A file left behind by a renamed or deleted story reads as coverage.
  it('has no file left over', () => {
    const slugs = new Set(PAGES.map((page) => page.slug))
    expect([...Object.keys(EN_DOCS), ...Object.keys(FA_DOCS)].filter((slug) => !slugs.has(slug))).toEqual([])
  })

  it('documents only stories that exist', () => {
    const wrong: string[] = []
    for (const page of PAGES) {
      for (const name of Object.keys(EN_DOCS[page.slug]?.stories ?? {})) {
        if (!page.stories.includes(name)) wrong.push(`en/${page.slug}: «${name}» is not a story`)
      }
      const fa = FA_DOCS[page.slug]
      for (const name of [...Object.keys(fa?.stories ?? {}), ...Object.keys(fa?.names ?? {})]) {
        if (!page.stories.includes(name)) wrong.push(`fa/${page.slug}: «${name}» is not a story`)
      }
    }
    expect(wrong).toEqual([])
  })

  // English is the reference: whatever it describes, Persian must describe too.
  it('translates everything the English documents', () => {
    const wrong: string[] = []
    for (const page of PAGES) {
      const en = EN_DOCS[page.slug]
      const fa = FA_DOCS[page.slug]
      for (const prop of Object.keys(en?.props ?? {})) {
        if (!fa?.props[prop]) wrong.push(`${page.slug}.${prop} — prop untranslated`)
      }
      for (const story of page.stories) {
        if (!fa?.stories[story]) wrong.push(`${page.slug}.${story} — story untranslated`)
        if (!fa?.names[story]) wrong.push(`${page.slug}.${story} — name untranslated`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('is written in the language it claims', () => {
    const persian = /[؀-ۿ]/
    for (const [slug, doc] of Object.entries(FA_DOCS)) {
      expect(doc.prose, `fa/${slug}`).toMatch(persian)
      for (const [key, text] of [...Object.entries(doc.props), ...Object.entries(doc.stories), ...Object.entries(doc.names)]) {
        expect(text, `fa/${slug}.${key}`).toMatch(persian)
      }
    }
    // English may quote a Persian label, «ذخیره و بعدی» is the button's name
    // so the check is that the sentence around it is English, not that no
    // Persian appears in it at all.
    for (const [slug, doc] of Object.entries(EN_DOCS)) {
      for (const [key, text] of [...Object.entries(doc.props), ...Object.entries(doc.stories)]) {
        expect(text, `en/${slug}.${key}`).toMatch(/[A-Za-z]{3}/)
      }
    }
  })
})
