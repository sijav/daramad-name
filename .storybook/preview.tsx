import '@fontsource-variable/vazirmatn'
import { I18nProvider } from '@lingui/react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DEFAULT_LOCALE, activateLocale, i18n } from 'src/core/i18n'
import { AppThemeProvider } from 'src/core/theme'
import { settingsQueryKey } from 'src/shared/queries'
import { FIXTURE_SETTINGS_PROFILE, seedPageData } from 'src/shared/story-fixtures'
import type { AppLocale, Settings, ThemePreference } from 'src/shared/types'
import { LocalizedDocs } from './LocalizedDocs'
import { LocalizedDocsContainer } from './LocalizedDocsContainer'

// Stories render through the app's providers: lingui, TanStack Query because
// settings come from a query, and the theme provider for colour scheme and
// direction. Locale and theme are toolbar globals rather than parameters, so
// any story can be checked in all four combinations without editing it.

// `data: null` is meaningful, not a missing key: Storybook deep-merges
// parameters, so a story cancels its meta's seed by nulling it.
type PageParameter = { data?: 'full' | 'empty' | null; route?: string }

const useCatalog = (locale: AppLocale): boolean => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    void activateLocale(locale).then(() => {
      if (!cancelled) {
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  return ready
}

// Components read the locale from persisted Settings rather than from lingui,
// and that is what drives number formatting, date digits and the picker's font.
// Seeding the query is what puts the toolbar in charge of those too.
const seededClient = (locale: AppLocale, themePreference: ThemePreference, pageData?: PageParameter['data']): QueryClient => {
  // `staleTime: Infinity` against the app's default of 0, or the query refetches
  // from IndexedDB on mount and overwrites the seed.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
  const settings: Settings = {
    calendar: 'JALALI',
    locale,
    themePreference,
    profile: FIXTURE_SETTINGS_PROFILE,
  }
  client.setQueryData(settingsQueryKey, settings)

  // Page stories also seed every query their page issues, so a whole page
  // renders from the cache with no IndexedDB involved.
  if (pageData) {
    seedPageData(client, { empty: pageData === 'empty' })
  }

  return client
}

// One client per mount, not one per render. The decorator renders at least
// twice, since `useCatalog` flips `ready`, and rebuilding the client each time
// discarded whatever a play function had written: a saved profile, an
// invalidation after a delete. The `key` below remounts it when the seed's own
// inputs change.
const SeededQueryProvider = ({
  locale,
  themePreference,
  pageData,
  children,
}: {
  locale: AppLocale
  themePreference: ThemePreference
  pageData?: PageParameter['data']
  children: ReactNode
}) => {
  const [client] = useState(() => seededClient(locale, themePreference, pageData))

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const withProviders: Decorator = (Story, context) => {
  const locale: AppLocale = context.globals.locale ?? DEFAULT_LOCALE
  const themePreference: ThemePreference = context.globals.theme ?? 'light'
  const page: PageParameter | undefined = context.parameters.page
  const ready = useCatalog(locale)

  if (!ready) {
    return <div />
  }

  // `layout: 'fullscreen'` only strips Storybook's own padding, so the
  // decorator's inset has to go with it. Those stories are showing edge-to-edge
  // chrome: the shell's fixed top bar, the printable certificate sheet.
  const content =
    context.parameters.layout === 'fullscreen' ? (
      <Story />
    ) : (
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <Story />
      </div>
    )

  // Pages call `useNavigate`, so they need a router, but only page stories get
  // one: `AppShell.stories.tsx` brings its own `MemoryRouter`, and react-router
  // throws on a `<Router>` rendered inside another.
  return (
    <I18nProvider i18n={i18n}>
      <SeededQueryProvider
        key={`${locale}-${themePreference}-${page?.data ?? 'none'}`}
        locale={locale}
        themePreference={themePreference}
        pageData={page?.data}
      >
        <AppThemeProvider locale={locale} themePreference={themePreference}>
          {page ? <MemoryRouter initialEntries={[page.route ?? '/']}>{content}</MemoryRouter> : content}
        </AppThemeProvider>
      </SeededQueryProvider>
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
  initialGlobals: { locale: DEFAULT_LOCALE, theme: 'light' },
  // Every component gets a generated Docs page without its `meta` opting in.
  tags: ['autodocs'],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    docs: {
      toc: true,
      // Both language-aware. See `src/shared/story-docs/README.md`.
      page: LocalizedDocs,
      container: LocalizedDocsContainer,
    },
    // No `actions.argTypesRegex` on purpose: it is deprecated, the visual-test
    // addon's build ignores it, so a snapshot depending on an action prop breaks
    // with nothing pointing at the cause, and the args it infers are not spies.
    // Every story passes an explicit `fn()` from `storybook/test` instead.
  },
  decorators: [withProviders],
}

export default preview
