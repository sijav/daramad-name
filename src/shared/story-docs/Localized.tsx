import type { ReactNode } from 'react'
import { isPersian, useDocsLocale } from './useDocsLocale'

/**
 * Picks one of two language versions of documentation prose from the Storybook
 * "Language" toolbar, and follows it when it changes.
 *
 * Used from `.mdx`, where prose is written inline in both languages. Generated
 * Docs pages take a different route — their Persian lives in `fa/*.md` and is
 * applied by `.storybook/LocalizedDocs.tsx`.
 */
export const Localized = ({ fa, en }: { fa: ReactNode; en: ReactNode }): ReactNode => (isPersian(useDocsLocale()) ? fa : en)
