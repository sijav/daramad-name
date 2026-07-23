import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { queryClient } from 'src/core/query'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, within } from 'storybook/test'
import { App } from './App'

// `App` mounts the app's own query client, so these stories bypass the cache
// `preview.tsx` seeds and read the real IndexedDB.
const boot = async () => {
  queryClient.clear()
  // Cleared so `readSettings` writes `defaultSettings` back: Persian, Jalali.
  await db.settings.clear()
  const clearFixtures = await seedDatabase()

  return async () => {
    await clearFixtures()
    await db.settings.clear()
    queryClient.clear()
  }
}

// MUI X's `ChartsAccessibilityProxy` renders two `role="img"` divs it names only
// while the chart has keyboard focus, so at rest axe sees an unnamed image on
// every chart. Off here and in the three other chart story files, and no other
// rule anywhere. SEE TECH-DEBT.md section 7.
const CHART_A11Y = { a11y: { config: { rules: [{ id: 'role-img-alt', enabled: false }] } } }

const meta = {
  title: 'App',
  component: App,
  parameters: { ...CHART_A11Y, layout: 'fullscreen', page: { route: '/' } },
  beforeEach: boot,
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

const CHROME = /تغییر تم|Switch theme/i

// Every route but the dashboard is `lazy()`. The default one-second window
// passes alone and fails in a full run. SEE TECH-DEBT.md section 8.
const LAZY_ROUTE = { timeout: 10_000 }

// `path="*"` renders the dashboard, so a route that stopped resolving would
// serve the dashboard and still screenshot correctly. Each story asserts the
// page's own `PageHeader` h2, which the fallback cannot produce.
const routeStory = (route: string, title: RegExp): Story => ({
  parameters: { page: { route } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 2, name: title }, LAZY_ROUTE)).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: CHROME })).toBeInTheDocument()
  },
})

export const LedgerRoute: Story = {
  parameters: { page: { route: '/ledger' } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('the lazy ledger route resolves', async () => {
      await expect(await canvas.findByRole('heading', { level: 2, name: /دفتر درآمد|Income ledger/i }, LAZY_ROUTE)).toBeInTheDocument()
    })

    await step('it renders inside the app shell', async () => {
      await expect(await canvas.findByRole('button', { name: CHROME })).toBeInTheDocument()
    })

    await step('the receipts and their total came from the database', async () => {
      const expected = FIXTURE_RECEIPTS.reduce((sum, receipt) => sum + receipt.amountToman, 0)
      // Formatted fa-IR because `boot` left the app on its default locale.
      const total = new Intl.NumberFormat('fa-IR').format(expected)

      await expect(await canvas.findAllByText('Aria Trading')).not.toHaveLength(0)
      await expect(await canvas.findAllByText((content) => content.includes(total))).not.toHaveLength(0)
    })
  },
}

export const UnknownRouteFallsBackToTheDashboard: Story = routeStory('/receipts/1404/march', /نمای کلی درآمد|Income overview/i)

export const CertificateRendersWithoutTheAppChrome: Story = {
  parameters: { page: { route: '/certificate' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: /چاپ|Print/i }, LAZY_ROUTE)).toBeInTheDocument()

    // The three landmarks `AppShell` publishes, none of which may print onto the
    // document: `banner` the top bar, `navigation` the rail and bottom bar,
    // `main` the wrapper pages render into. This goes red if the certificate
    // route ever moves inside the shell.
    await expect(canvas.queryByRole('button', { name: CHROME })).toBeNull()
    await expect(canvas.queryByRole('main')).toBeNull()
    await expect(canvas.queryByRole('navigation')).toBeNull()
    await expect(canvas.queryByRole('banner')).toBeNull()
  },
}

export const QuickEntryRoute: Story = routeStory('/quick-entry', /^ثبت سریع دریافتی$|^Record a receipt quickly$/)

export const ChartsRoute: Story = routeStory('/charts', /^نمودارها$|^Charts$/)

export const ReportRoute: Story = routeStory('/report', /^گزارش درآمد$|^Income report$/)

export const SettingsRoute: Story = routeStory('/settings', /^تنظیمات$|^Settings$/)
