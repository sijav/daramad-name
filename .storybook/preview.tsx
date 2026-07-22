import '@fontsource-variable/vazirmatn'
import { I18nProvider } from '@lingui/react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from 'src/core/i18n'
import { AppThemeProvider } from 'src/core/theme'
import { settingsQueryKey } from 'src/shared/queries'
import { seedPageData } from 'src/shared/story-fixtures'
import type { AppLocale, Settings, ThemePreference } from 'src/shared/types'

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

/**
 * Components read the locale from persisted Settings, not from lingui — that is
 * what drives number formatting, date digits and the picker's font. Seeding the
 * query cache makes the toolbar control those too; without it the labels switch
 * to English while the figures stay Persian.
 */
const seededClient = (locale: AppLocale, themePreference: ThemePreference, pageData?: 'full' | 'empty'): QueryClient => {
  // `staleTime: Infinity` matters: with the app's default of 0 the query
  // refetches from IndexedDB the moment it mounts and overwrites the seed,
  // leaving English labels beside Persian numerals.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
  const settings: Settings = {
    calendar: 'JALALI',
    locale,
    themePreference,
    profile: { fullName: 'رها موسوی', nationalId: '', phone: '', address: '' },
  }
  client.setQueryData(settingsQueryKey, settings)

  // Page stories additionally seed every query their page issues, so a whole
  // page renders from the cache with no IndexedDB involved.
  if (pageData) {
    seedPageData(client, { empty: pageData === 'empty' })
  }

  return client
}

const withProviders: Decorator = (Story, context) => {
  const locale = (context.globals.locale ?? 'fa-IR') as AppLocale
  const themePreference = (context.globals.theme ?? 'light') as ThemePreference
  const page = context.parameters.page as { data?: 'full' | 'empty'; route?: string } | undefined
  const ready = useCatalog(locale)

  if (!ready) {
    return <div />
  }

  // Pages call `useNavigate`, so they need a router. It is only added when a
  // story asks for it — AppShell supplies its own, and nesting two routers
  // would make the inner one unreachable.
  const content = (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <Story />
    </div>
  )

  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={seededClient(locale, themePreference, page?.data)}>
        <AppThemeProvider locale={locale} themePreference={themePreference}>
          {page ? <MemoryRouter initialEntries={[page.route ?? '/']}>{content}</MemoryRouter> : content}
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
  // Every component gets a generated Docs page — props table, description and
  // rendered source — without each `meta` opting in. The prop tables are only
  // as good as the types and doc comments behind them, which is why the props
  // interfaces carry JSDoc: those comments become the Description column.
  tags: ['autodocs'],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    docs: {
      // A component with six state variants is a page worth navigating.
      toc: true,
    },
    // No `actions.argTypesRegex` here on purpose.
    //
    // It looked like free coverage — every `onSomething` logging to the Actions
    // panel without each story wiring a handler — but it is deprecated, and the
    // visual-test addon's build ignores it, so a snapshot that depends on an
    // action prop breaks in a way that is very hard to trace back. Args it
    // infers are not spies either, so a play function can never assert on them.
    //
    // Every story passes an explicit `fn()` from `storybook/test` instead,
    // which both logs to the panel and is assertable.
  },
  decorators: [withProviders],
}

export default preview
