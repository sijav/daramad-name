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
  /** The `msgid_plural` of a gettext plural entry, absent on an ordinary one. */
  idPlural: string | null
  /** Every `msgstr` form: one for a singular entry, one per plural form otherwise. */
  translations: string[]
}

/**
 * Minimal PO reader: `msgid`/`msgid_plural`/`msgstr`, continuation lines,
 * obsolete entries dropped.
 *
 * The plural forms are read even though the catalog holds none today. Matching
 * only `msgstr ` — with the trailing space — silently DISCARDED any entry
 * written as `msgstr[0]`, so the first `plural` macro anyone adds would have
 * reopened the exact hole these tests exist to close: an untranslated string
 * shipping to a Persian screen with nothing failing.
 */
const parseCatalog = (source: string): Entry[] => {
  const entries: Entry[] = []
  let id: string | null = null
  let idPlural: string | null = null
  let translations: string[] | null = null
  let field: 'id' | 'idPlural' | 'translation' | null = null
  let form = 0

  const flush = () => {
    if (id !== null && translations !== null && id !== '') {
      entries.push({ id, idPlural, translations })
    }
    id = null
    idPlural = null
    translations = null
    field = null
    form = 0
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
    if (trimmed.startsWith('msgid_plural ')) {
      idPlural = unquote(trimmed)
      field = 'idPlural'
      continue
    }
    if (trimmed.startsWith('msgid ')) {
      flush()
      id = unquote(trimmed)
      field = 'id'
      continue
    }
    if (trimmed.startsWith('msgstr ') || trimmed.startsWith('msgstr[')) {
      form = Number(/^msgstr\[(\d+)]/.exec(trimmed)?.[1] ?? 0)
      translations = translations ?? []
      translations[form] = unquote(trimmed)
      field = 'translation'
      continue
    }
    if (trimmed.startsWith('"') && field) {
      const continuation = unquote(trimmed)
      if (field === 'id') {
        id = (id ?? '') + continuation
      } else if (field === 'idPlural') {
        idPlural = (idPlural ?? '') + continuation
      } else if (translations) {
        translations[form] += continuation
      }
    }
  }
  flush()

  return entries
}

const entries = parseCatalog(readFileSync(CATALOG, 'utf8'))

/** `{0}`, `{name}` — the values the sentence is actually about. */
const placeholders = (message: string): string[] => [...message.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort()

/** What every form of a translation has to carry: the singular's names, plus the plural's. */
const declared = (entry: Entry): string[] => [...new Set([...placeholders(entry.id), ...placeholders(entry.idPlural ?? '')])].sort()

describe('the fa-IR catalog', () => {
  it('has entries to check, so a broken parse cannot pass silently', () => {
    expect(entries.length).toBeGreaterThan(100)
  })

  // An untranslated entry renders its English id. On a Persian screen that is
  // a visible defect that no test, type or lint rule catches. Every plural form
  // counts separately: Persian needs both, and a filled "one" beside an empty
  // "other" ships English on exactly the counts nobody tests with.
  it('translates every message', () => {
    const untranslated = entries.filter((entry) => entry.translations.some((form) => form === '')).map((entry) => entry.id)

    expect(untranslated).toEqual([])
  })

  // Dropping `{0}` from a translation deletes the number from the sentence:
  // «۳ دریافتی» silently becomes «دریافتی». The string still reads as Persian,
  // so a reviewer skimming the catalog would not notice.
  it('keeps every placeholder the English message declares', () => {
    const dropped = entries
      .filter((entry) => entry.translations.some((form) => placeholders(form).join() !== declared(entry).join()))
      .map((entry) => entry.id)

    expect(dropped).toEqual([])
  })
})
