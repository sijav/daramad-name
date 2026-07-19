import type { LinguiConfig } from '@lingui/conf'
import { formatter } from '@lingui/format-po'

// The interface is Persian. English exists only for the report's English
// variant (scenario 3 — the embassy copy), so `fa-IR` is the source locale
// and message ids are the Persian strings themselves.
const config: LinguiConfig = {
  locales: ['fa-IR', 'en-US'],
  sourceLocale: 'fa-IR',
  fallbackLocales: { default: 'fa-IR' },
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/node_modules/**', '**/*.stories.tsx'],
    },
  ],
  compileNamespace: 'ts',
  format: formatter({ lineNumbers: false }),
}

export default config
