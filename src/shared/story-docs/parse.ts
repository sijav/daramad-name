/** A page's prose, plus a line per prop, per story, and per story name. */
export interface StoryDoc {
  prose: string
  props: Readonly<Record<string, string>>
  stories: Readonly<Record<string, string>>
  names: Readonly<Record<string, string>>
}

/** `Shared/PageHeader` -> `shared-pageheader`, the name of its markdown file. */
export const docSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** `- \`key\`: description`, with the description free to run to the line end. */
const entries = (section: string | undefined): Record<string, string> => {
  const found: Record<string, string> = {}
  if (!section) return found

  const pattern = /^-\s+`([^`]+)`\s*:\s*(.+)$/gm
  let match = pattern.exec(section)
  while (match) {
    found[match[1]] = match[2].trim()
    match = pattern.exec(section)
  }
  return found
}

/** Splits the `##` lists off the end of a file, leaving the prose. */
export const parse = (text: string): StoryDoc => {
  // `split` with a capturing group keeps the heading, so the sections can be
  // matched to it by name and written in any order.
  const parts = text.split(/^##\s+(props|stories|names)\s*$/m)
  const sections: Record<string, string> = {}
  for (let index = 1; index < parts.length; index += 2) {
    sections[parts[index]] = parts[index + 1] ?? ''
  }

  return {
    prose: parts[0].trim(),
    props: entries(sections.props),
    stories: entries(sections.stories),
    names: entries(sections.names),
  }
}
