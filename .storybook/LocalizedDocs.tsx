import { Controls, Description, DocsContext, Markdown, Primary, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks'
import { useContext } from 'react'
import { docsFor } from 'src/shared/story-docs/storyDocs'
import { isPersian, useDocsLocale } from 'src/shared/story-docs/useDocsLocale'

// The generated Docs page, in both languages. See
// `src/shared/story-docs/README.md` for the format and the reasoning.

interface Described {
  description?: string
}
interface StoryWithDescription {
  name?: string
  parameters?: { docs?: { description?: { story?: string } } }
}

// The Controls table and the Stories block read their text straight off the
// resolved objects, with no way to pass overrides in, so it is written onto
// those objects before the blocks render. The originals are stashed here, or
// the first switch away from the default language would be permanent.
const ORIGINAL = new WeakMap<object, string | undefined>()

const restore = <T extends object>(target: T, key: string | undefined, read: () => string | undefined): string | undefined => {
  if (!ORIGINAL.has(target)) ORIGINAL.set(target, read())
  return key ?? ORIGINAL.get(target)
}

const describeProps = (argTypes: Record<string, Described> | undefined, texts: Readonly<Record<string, string>>): void => {
  for (const [name, argType] of Object.entries(argTypes ?? {})) {
    if (!argType || typeof argType !== 'object') continue
    argType.description = restore(argType, texts[name], () => argType.description)
  }
}

const describeStories = (
  stories: StoryWithDescription[],
  texts: Readonly<Record<string, string>>,
  names: Readonly<Record<string, string>>,
): void => {
  for (const story of stories) {
    const parameters = (story.parameters ??= {})
    const docs = (parameters.docs ??= {})
    const description = (docs.description ??= {})

    // Read the English name from the store rather than off the object, which by
    // now may hold the bilingual heading this wrote on a previous render.
    if (!ORIGINAL.has(story)) ORIGINAL.set(story, story.name)
    const english = ORIGINAL.get(story)
    const translated = english ? names[english] : undefined
    story.name = translated && english ? `${translated} (${english})` : english

    description.story = restore(description, english ? texts[english] : undefined, () => description.story)
  }
}

export const LocalizedDocs = () => {
  const persian = isPersian(useDocsLocale())
  const context = useContext(DocsContext)

  // `useOf` is the documented way to reach the current page's meta and primary
  // story from inside a Docs page. It throws when a page has neither, which is
  // not a reason to lose the whole page.
  let doc: ReturnType<typeof docsFor>
  let argTypes: Record<string, Described> | undefined
  try {
    const resolved = useOf('meta')
    doc = docsFor('preparedMeta' in resolved ? resolved.preparedMeta?.title : undefined, persian)
    const story = useOf('story')
    argTypes = 'story' in story ? (story.story?.argTypes as Record<string, Described> | undefined) : undefined
  } catch {
    doc = undefined
  }

  // In render rather than an effect: `Controls` and `Stories` are children, and
  // children render after their parent, so they see what this just wrote.
  describeProps(argTypes, doc?.props ?? {})
  describeStories((context.componentStories?.() ?? []) as StoryWithDescription[], doc?.stories ?? {}, doc?.names ?? {})

  return (
    <>
      <Title />
      <Subtitle />
      {doc?.prose ? <Markdown>{doc.prose}</Markdown> : <Description />}
      <Primary />
      <Controls />
      <Stories />
    </>
  )
}
