import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The app DEFAULTS to Persian, so a gap in the fa-IR catalog is not a missing
// translation — it is an English string on an Iranian user's screen, shipped.
// Nothing in the build fails when that happens: lingui falls back to the
// message id, and because English is the source locale those ids ARE English.
//
// Parsed from the `.po` rather than the compiled catalog because the compiled
// form has already collapsed the fallback, which is precisely what we are
// looking for.

const CATALOG = join(dirname(fileURLToPath(import.meta.url)), '../../locales/fa-IR/messages.po')

interface Entry {
  id: string
  translation: string
}

/** Minimal PO reader: `msgid`/`msgstr` with continuation lines, obsolete entries dropped. */
const parseCatalog = (source: string): Entry[] => {
  const entries: Entry[] = []
  let id: string | null = null
  let translation: string | null = null
  let field: 'id' | 'translation' | null = null

  const flush = () => {
    if (id !== null && translation !== null && id !== '') {
      entries.push({ id, translation })
    }
    id = null
    translation = null
    field = null
  }

  const unquote = (line: string): string => line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'))

  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    // `#~` marks an entry lingui no longer extracts; it is dead weight in the
    // file, not a string the app can render.
    if (trimmed.startsWith('#~')) {
      flush()
      continue
    }
    if (trimmed.startsWith('#') || trimmed === '') {
      if (trimmed === '') {
        flush()
      }
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
    if (trimmed.startsWith('"') && field) {
      const continuation = unquote(trimmed)
      if (field === 'id') {
        id = (id ?? '') + continuation
      } else {
        translation = (translation ?? '') + continuation
      }
    }
  }
  flush()

  return entries
}

const entries = parseCatalog(readFileSync(CATALOG, 'utf8'))

/** `{0}`, `{name}` — the values the sentence is actually about. */
const placeholders = (message: string): string[] => [...message.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort()

describe('the fa-IR catalog', () => {
  it('has entries to check, so a broken parse cannot pass silently', () => {
    expect(entries.length).toBeGreaterThan(100)
  })

  // An untranslated entry renders its English id. On a Persian screen that is
  // a visible defect that no test, type or lint rule catches.
  it('translates every message', () => {
    const untranslated = entries.filter((entry) => entry.translation === '').map((entry) => entry.id)

    expect(untranslated).toEqual([])
  })

  // Dropping `{0}` from a translation deletes the number from the sentence:
  // «۳ دریافتی» silently becomes «دریافتی». The string still reads as Persian,
  // so a reviewer skimming the catalog would not notice.
  it('keeps every placeholder the English message declares', () => {
    const dropped = entries
      .filter((entry) => placeholders(entry.id).join() !== placeholders(entry.translation).join())
      .map((entry) => entry.id)

    expect(dropped).toEqual([])
  })
})
