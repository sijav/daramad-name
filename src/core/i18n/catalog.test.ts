import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The app defaults to Persian, so an untranslated entry puts an English string
// on an Iranian user's screen with nothing in the build failing: English is the
// source locale, so the ids lingui falls back to ARE English. Read from the
// `.po` because `lingui compile` inlines the en-US fallback and hides the gap.

const CATALOG = join(dirname(fileURLToPath(import.meta.url)), '../../locales/fa-IR/messages.po')
const lines = readFileSync(CATALOG, 'utf8').split('\n')

interface Entry {
  id: string
  translation: string
}

// Minimal PO reader: `msgid`, `msgstr`, and the continuation lines a translator
// saving from Poedit adds to every long entry. Gettext plural entries
// (`msgid_plural`, `msgstr[0]`) are not handled, `@lingui/format-po` keeps ICU
// plurals inside one `msgstr` and never writes them. A formatter that did would
// fail the entry count below rather than slip past it.
const parseCatalog = (source: string[]): Entry[] => {
  const entries: Entry[] = []
  let id: string | null = null
  let translation: string | null = null
  let field: 'id' | 'translation' | null = null

  const flush = () => {
    if (id && translation !== null) {
      entries.push({ id, translation })
    }
    id = null
    translation = null
    field = null
  }

  const unquote = (line: string): string => line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'))

  for (const line of source) {
    const trimmed = line.trim()
    // A blank line closes an entry. `#~` opens one lingui no longer extracts,
    // which the app can no longer render.
    if (trimmed === '' || trimmed.startsWith('#~')) {
      flush()
      continue
    }
    if (trimmed.startsWith('#')) {
      continue
    }
    if (trimmed.startsWith('msgid ')) {
      flush()
      id = unquote(trimmed)
      field = 'id'
      continue
    }
    if (trimmed.startsWith('msgstr ')) {
      translation = unquote(trimmed)
      field = 'translation'
      continue
    }
    if (trimmed.startsWith('"')) {
      if (field === 'id') {
        id = (id ?? '') + unquote(trimmed)
      } else if (field === 'translation') {
        translation = (translation ?? '') + unquote(trimmed)
      }
    }
  }
  flush()

  return entries
}

const entries = parseCatalog(lines)

/** The `{0}` and `{name}` names a message interpolates. */
const placeholders = (message: string): string[] => [...message.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort()

describe('the fa-IR catalog', () => {
  // Anything the reader does not recognise is dropped, and a dropped entry is an
  // unchecked one. The count is one short of the `msgid` lines because the first
  // entry is the header, which carries the file metadata and no message.
  it('parses every entry in the file', () => {
    const declared = lines.filter((line) => line.startsWith('msgid ')).length - 1

    expect(entries.length).toBeGreaterThan(100)
    expect(entries).toHaveLength(declared)
  })

  it('translates every message', () => {
    const untranslated = entries.filter((entry) => entry.translation === '').map((entry) => entry.id)

    expect(untranslated).toEqual([])
  })

  // A translation that drops `{0}` loses the number: «{0} دریافتی» renders as
  // «دریافتی» and still reads as fluent Persian.
  it('keeps every placeholder the English message declares', () => {
    const dropped = entries
      .filter((entry) => placeholders(entry.translation).join() !== placeholders(entry.id).join())
      .map((entry) => entry.id)

    expect(dropped).toEqual([])
  })
})
