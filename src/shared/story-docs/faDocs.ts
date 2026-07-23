// The Persian half of every generated Docs page.
//
// Autodocs takes its English from the story files, which is the right home for
// it: `argTypes[prop].description` sits beside the story that demonstrates the
// prop. The Persian is not — it is translated copy, it is long, and burying
// paragraphs of it in a `.tsx` puts prose where code goes and makes it
// unreadable to anyone editing the translation rather than the story.
//
// So each page's Persian lives in its own markdown file under `fa/`, named
// after the story title. The page's prose comes first, then a line per prop and
// a line per story — the three things a generated page actually says:
//
//     شرحِ صفحه…
//
//     ## props
//
//     - `tone` — کدام نقشِ پالت را می‌گیرد.
//
//     ## stories
//
//     - `Frozen` — قرصِ نرخِ فریزشده روی کشوی جزئیات.
//
//     ## names
//
//     - `Frozen` — فریزشده
//
// Stories are keyed by their DISPLAY name («All Tones», not `AllTones`), which
// is what the page prints beside the translation.
//
// A translated NAME is shown as «فریزشده (Frozen)» rather than on its own: the
// English is the story's identity — it is what the sidebar lists, what the URL
// carries and what a developer greps for — so dropping it would leave a Persian
// reader unable to say which story they are looking at.
//
// `faDocs.test.ts` fails the build if the two sides stop lining up — a mismatch
// would otherwise be silent, showing English on a page that asked for Persian.

/** `Shared/PageHeader` -> `shared-pageheader`, the name of its markdown file. */
export const docSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** A page's translated prose, plus a line per prop, per story and per story name. */
export interface FaDoc {
  prose: string
  props: Readonly<Record<string, string>>
  stories: Readonly<Record<string, string>>
  names: Readonly<Record<string, string>>
}

/** `- \`name\` — description`, with the description free to run to the line end. */
const entries = (section: string | undefined): Record<string, string> => {
  const found: Record<string, string> = {}
  if (!section) return found

  const pattern = /^-\s+`([^`]+)`\s*[—–-]\s*(.+)$/gm
  let match = pattern.exec(section)
  while (match) {
    found[match[1]] = match[2].trim()
    match = pattern.exec(section)
  }
  return found
}

/** Splits the `##` lists off the end of a file, leaving the prose. */
const parse = (text: string): FaDoc => {
  // `split` with a capturing group keeps the heading, so the sections can be
  // matched to it by name and written in any order.
  const parts = text.split(/^##\s+(props|stories|names)\s*$/m)
  const sections: Record<string, string> = {}
  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i]] = parts[i + 1] ?? ''
  }

  return {
    prose: parts[0].trim(),
    props: entries(sections.props),
    stories: entries(sections.stories),
    names: entries(sections.names),
  }
}

// Eager because a Docs page renders synchronously; there is nowhere to await.
const FILES: Record<string, string> = import.meta.glob('./fa/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Keyed by slug rather than by path, so callers need not know the layout. */
export const FA_DOCS: Readonly<Record<string, FaDoc>> = Object.fromEntries(
  Object.entries(FILES).map(([path, text]) => [path.replace(/^\.\/fa\/|\.md$/g, ''), parse(text)]),
)

/** The Persian for a story title, or nothing if it has not been translated. */
export const faDocFor = (title: string | undefined): FaDoc | undefined => (title ? FA_DOCS[docSlug(title)] : undefined)
