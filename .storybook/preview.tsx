import '@fontsource-variable/vazirmatn'
import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RtlProvider } from 'src/core/theme'

// Components read settings (for the calendar) through TanStack Query, so
// stories need a client. A fresh one per story keeps them isolated.
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' }
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RtlProvider>
          <div dir="rtl" style={{ padding: 24 }}>
            <Story />
          </div>
        </RtlProvider>
      </QueryClientProvider>
    )
  ]
}

export default preview
