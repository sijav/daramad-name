import { docSlug, parse, type StoryDoc } from './parse'

// Documentation for the generated Docs pages, in both languages.
//
// Autodocs would read all of it out of the story file at build time, which
// makes it English-only and puts paragraphs of prose where code goes. Instead
// each page has one markdown file per language, named after the story title,
// and `.storybook/LocalizedDocs.tsx` applies whichever the Language toolbar
// asks for. See `src/shared/story-docs/README.md` for the format.

const read = (files: Record<string, string>, prefix: string): Readonly<Record<string, StoryDoc>> =>
  Object.fromEntries(Object.entries(files).map(([path, text]) => [path.replace(prefix, '').replace(/\.md$/, ''), parse(text)]))

// Eager because a Docs page renders synchronously; there is nowhere to await.
// The options must be written out at each call — Vite parses `import.meta.glob`
// statically and rejects anything but an object literal.
export const EN_DOCS = read(
  import.meta.glob('./en/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  './en/',
)
export const FA_DOCS = read(
  import.meta.glob('./fa/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  './fa/',
)

/** The documentation for a story title in one language, if it has been written. */
export const docsFor = (title: string | undefined, persian: boolean): StoryDoc | undefined =>
  title ? (persian ? FA_DOCS : EN_DOCS)[docSlug(title)] : undefined

export { docSlug }
export type { StoryDoc }
