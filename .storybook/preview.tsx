import '@fontsource-variable/vazirmatn'
import { I18nProvider } from '@lingui/react'
import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { i18n } from 'src/core/i18n'
import { RtlProvider } from 'src/core/theme'
import { messages } from 'src/locales/fa-IR/messages'

// Stories render through the same providers as the app: lingui for copy,
// TanStack Query because several components read settings (the calendar) via a
// query, and the RTL provider for direction-aware styling.
i18n.loadAndActivate({ locale: 'fa-IR', messages })

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' },
    backgrounds: {
      options: {
        // The design's surface colour — the glass cards are invisible on white.
        surface: { name: 'App surface', value: '#f7f8fa' },
        white: { name: 'White', value: '#ffffff' },
      },
    },
  },
  initialGlobals: { backgrounds: { value: 'surface' } },
  decorators: [
    (Story) => (
      <I18nProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <RtlProvider>
            <div dir="rtl" style={{ padding: 24 }}>
              <Story />
            </div>
          </RtlProvider>
        </QueryClientProvider>
      </I18nProvider>
    ),
  ],
}

export default preview
