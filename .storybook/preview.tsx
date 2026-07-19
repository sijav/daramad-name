import '@fontsource-variable/vazirmatn'
import { I18nProvider } from '@lingui/react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { i18n } from 'src/core/i18n'
import { AppThemeProvider } from 'src/core/theme'
import type { AppLocale, ThemePreference } from 'src/shared/types'

// Stories render through the same providers as the app: lingui for copy,
// TanStack Query because several components read settings via a query, and the
// theme provider for colour scheme + direction.
//
// Locale and theme are Storybook globals rather than parameters, so every story
// can be checked in all four combinations from the toolbar without editing it.

const catalogs: Record<AppLocale, () => Promise<{ messages: Record<string, string> }>> = {
  'fa-IR': () => import('src/locales/fa-IR/messages'),
  'en-US': () => import('src/locales/en-US/messages'),
}

const useCatalog = (locale: AppLocale): boolean => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    void catalogs[locale]().then(({ messages }) => {
      if (!cancelled) {
        i18n.loadAndActivate({ locale, messages })
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  return ready
}

const withProviders: Decorator = (Story, context) => {
  const locale = (context.globals.locale ?? 'fa-IR') as AppLocale
  const themePreference = (context.globals.theme ?? 'light') as ThemePreference
  const ready = useCatalog(locale)

  if (!ready) {
    return <div />
  }

  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AppThemeProvider locale={locale} themePreference={themePreference}>
          {/* Matches the app's page surface so glass cards are visible. */}
          <div style={{ padding: 24, minHeight: '100vh', background: 'var(--sb-surface, transparent)' }}>
            <Story />
          </div>
        </AppThemeProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Interface language and text direction',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'fa-IR', title: 'فارسی (RTL)', right: 'RTL' },
          { value: 'en-US', title: 'English (LTR)', right: 'LTR' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'fa-IR', theme: 'light' },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' },
    // The theme paints its own background, so Storybook's backgrounds addon
    // would only fight it.
    backgrounds: { disable: true },
  },
  decorators: [withProviders],
}

export default preview
