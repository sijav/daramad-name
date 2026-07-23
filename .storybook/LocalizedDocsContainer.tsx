import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks'
import type { PropsWithChildren } from 'react'
import { isPersian, useDocsLocale } from 'src/shared/story-docs/useDocsLocale'

// Direction for the documentation itself, which nothing else sets.
//
// A story gets its direction from the preview decorator, which writes `dir` on
// `<html>` while the story renders. Documentation is not a story: an `.mdx`
// page has no decorator at all, so Persian prose was laid out left to right,
// with the paragraph ragged on the wrong edge and every «quote» and full stop
// at the wrong end of the line.
//
// Setting it here rather than on `<html>` keeps it to the page: the Storybook
// chrome around it is English and stays left to right.
export const LocalizedDocsContainer = ({ children, ...props }: PropsWithChildren<DocsContainerProps>) => {
  const persian = isPersian(useDocsLocale())

  return (
    <DocsContainer {...props}>
      <div dir={persian ? 'rtl' : 'ltr'} lang={persian ? 'fa-IR' : 'en-US'}>
        {children}
      </div>
    </DocsContainer>
  )
}
