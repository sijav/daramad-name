import type { LinguiConfig } from '@lingui/conf'
import { formatter } from '@lingui/format-po'

// English is the source locale, so message ids in the code are English strings
// and Persian lives in `src/locales/fa-IR/messages.po` as a translation.
//
// The app still *defaults* to Persian at runtime, that is a user-facing
// default stored in Settings, independent of which language the code is
// authored in.
const config: LinguiConfig = {
  locales: ['en-US', 'fa-IR'],
  sourceLocale: 'en-US',
  fallbackLocales: { default: 'en-US' },
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
