# Storybook documentation

Everything a generated Docs page prints, in both languages, kept out of the
story files.

## Why it is not in the code

Autodocs reads a page's prose from the JSDoc above `const meta`, each prop's
description from `argTypes`, and each story's note from the docblock above its
export. All of that is read at build time, so it can only ever be in one
language — and it puts paragraphs of prose in a `.tsx`, where it is unreadable
to anyone editing the wording rather than the code.

So the prose lives here instead, and `.storybook/LocalizedDocs.tsx` applies
whichever language the Storybook "Language" toolbar is set to.

## The layout

```
story-docs/
  en/<slug>.md    English
  fa/<slug>.md    Persian
```

The slug is the story title, lowercased with everything but letters and digits
turned into dashes: `Shared/PageHeader` becomes `shared-pageheader`. Add a story
file and you add two markdown files.

## The format

Both languages use the same shape. Prose first, then up to three lists:

```markdown
What the component is, and the constraint that shaped it.

A second paragraph if it needs one.

## props

- `tone` — Which palette role the pill paints in.

## stories

- `All Tones` — All four tones at once, for comparison.

## names

- `All Tones` — همه‌ی لحن‌ها
```

- Keys go in backticks. The separator is an em dash with a space either side.
- One entry per line. A description may not wrap.
- `## props` keys are prop names, exactly as the component declares them.
- `## stories` and `## names` keys are the DISPLAY name Storybook prints —
  `All Tones`, not `AllTones`.
- `## names` is Persian only. English pages already read in English, and the
  heading renders as «همه‌ی لحن‌ها (All Tones)» so the English name, which is
  the story's identity in the sidebar and the URL, stays visible.
- Any section may be left out. What is missing falls back to Storybook's own
  resolution, which for English means the component's docgen.

## What still belongs in the story file

Comments that explain the code: why a story pins a global, why an assertion is
written the way it is, why a harness exists. Those are for whoever edits the
test, not for the documentation site.

## The guard

`storyDocs.test.ts` fails if the two sides stop lining up: a prop or story with
no entry, an entry naming something that no longer exists, or a Persian file
that is missing what the English documents. Add a story and it fails until both
languages describe it.
