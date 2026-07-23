import { Controls, Description, DocsContext, Markdown, Primary, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks'
import { useContext } from 'react'
import { faDocFor } from 'src/shared/story-docs/faDocs'
import { isPersian, useDocsLocale } from 'src/shared/story-docs/useDocsLocale'

// The generated Docs page, in both languages.
//
// Autodocs reads everything it prints — the page prose, the prop descriptions
// and the note above each story — from the story file at BUILD time. So unlike
// `Introduction.mdx` these pages could never follow the Language toolbar. This
// replaces the default page with the same blocks, and translates all three from
// `src/shared/story-docs/fa`.
//
// Titles are not localised. They come from the story hierarchy, which is Latin
// by design, as are the prop names and types in the table.

/** The parts of Storybook's own types this page rewrites; theirs are much wider. */
interface Described {
  description?: string
}
interface StoryWithDescription {
  name?: string
  parameters?: { docs?: { description?: { story?: string } } }
}

// The English text, kept per object so switching back restores it.
//
// The Controls table and the Stories block read their descriptions straight off
// the resolved objects, with no way to pass overrides in — so the translation is
// written onto those objects before the blocks render. Without the original
// stashed here the first switch to Persian would be permanent.
const ENGLISH = new WeakMap<object, string | undefined>()

const swap = <T extends object>(
  target: T,
  read: (target: T) => string | undefined,
  write: (target: T, text?: string) => void,
  persian?: string,
) => {
  if (!ENGLISH.has(target)) ENGLISH.set(target, read(target))
  write(target, persian ?? ENGLISH.get(target))
}

const describeProps = (argTypes: Record<string, Described> | undefined, persian: Readonly<Record<string, string>>): void => {
  for (const [name, argType] of Object.entries(argTypes ?? {})) {
    if (!argType || typeof argType !== 'object') continue
    swap(
      argType,
      (a) => a.description,
      (a, text) => {
        a.description = text
      },
      persian[name],
    )
  }
}

const describeStories = (
  stories: StoryWithDescription[],
  persian: Readonly<Record<string, string>>,
  names: Readonly<Record<string, string>>,
): void => {
  for (const story of stories) {
    // Every prepared story has parameters, but the docs branch is only there
    // once something has written to it — a story with no docblock has neither.
    const parameters = (story.parameters ??= {})
    const docs = (parameters.docs ??= {})
    const description = (docs.description ??= {})

    // Read the English name back out of the store rather than off the object,
    // which by now may be holding the bilingual heading this wrote last time.
    if (!ENGLISH.has(story)) ENGLISH.set(story, story.name)
    const english = ENGLISH.get(story)
    const translated = english ? names[english] : undefined
    story.name = translated && english ? `${translated} (${english})` : english

    swap(
      description,
      (d) => d.story,
      (d, text) => {
        d.story = text
      },
      english ? persian[english] : undefined,
    )
  }
}

export const LocalizedDocs = () => {
  const persian = isPersian(useDocsLocale())
  const context = useContext(DocsContext)

  // `useOf` is the documented way to reach the current page's meta and primary
  // story from inside a Docs page. It throws when a page has neither, which is
  // not a reason to lose the whole page.
  let doc: ReturnType<typeof faDocFor>
  let argTypes: Record<string, Described> | undefined
  try {
    const resolved = useOf('meta')
    doc = faDocFor('preparedMeta' in resolved ? resolved.preparedMeta?.title : undefined)
    const story = useOf('story')
    argTypes = 'story' in story ? (story.story?.argTypes as Record<string, Described> | undefined) : undefined
  } catch {
    doc = undefined
  }

  // In render rather than an effect: `Controls` and `Stories` are children, and
  // children render after their parent, so they see what this just wrote.
  describeProps(argTypes, persian ? (doc?.props ?? {}) : {})
  describeStories(
    (context.componentStories?.() ?? []) as StoryWithDescription[],
    persian ? (doc?.stories ?? {}) : {},
    persian ? (doc?.names ?? {}) : {},
  )

  return (
    <>
      <Title />
      <Subtitle />
      {doc && persian ? <Markdown>{doc.prose}</Markdown> : <Description />}
      <Primary />
      <Controls />
      <Stories />
    </>
  )
}
