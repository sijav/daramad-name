import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { queryClient } from 'src/core/query'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, within } from 'storybook/test'
import { App } from './App'

// Every route but the dashboard is a `lazy()` chunk. Under the browser test
// runner those chunks are fetched over HTTP at click time, and that fetch is
// not reliable here — it failed with "Failed to fetch dynamically imported
// module", which surfaces as the error boundary and, once React has torn down,
// as a null `useContext`. Importing the same modules here puts them in the
// story's own module graph, so `lazy()` resolves them from the registry instead
// of going back to the network. The app still code-splits in production; only
// the test stops depending on a live fetch.
import 'src/pages/certificate'
import 'src/pages/charts'
import 'src/pages/ledger'
import 'src/pages/quick-entry'
import 'src/pages/report'
import 'src/pages/settings'

// The whole app, mounted at a route, over the real database.
//
// `App` is wiring, but the wiring decides three things that a page-level story
// can never see: whether the locale gate opens at all (lingui throws rather
// than falling back, so a stuck gate is a blank app), where each route lands,
// and which routes are inside the shell. The certificate is the one that
// matters most — it is the document a freelancer hands to an embassy or a
// landlord, and it must print with no navigation attached to it.
//
// Nothing here is seeded into the query cache: `App` brings its own query
// client, so these stories exercise the same IndexedDB path the real app does.

const boot = async () => {
  queryClient.clear()
  // Cleared so `readSettings` seeds its defaults — Persian, Jalali — exactly as
  // it would for a first-ever visitor.
  await db.settings.clear()
  const clearFixtures = await seedDatabase()

  return async () => {
    await clearFixtures()
    await db.settings.clear()
    queryClient.clear()
  }
}

// `role-img-alt` is switched off HERE ONLY, and it is upstream rather than ours.
//
// MUI X renders `ChartsAccessibilityProxy`: two `role="img"` divs pointing at
// `voiceover-<chartId>-1|2` elements that the library creates EMPTY and fills
// only while the chart has keyboard focus. It is a live-region proxy for
// keyboard navigation, not a static image label — so at rest axe correctly sees
// `role="img"` with an empty name, on every chart, in every story.
//
// The only ways to satisfy the rule are to pass `disableKeyboardNavigation`,
// which removes a real accessibility feature to please a checker, or to write
// into MUI X's internal divs. Both are worse than the finding. Every other axe
// rule stays enforced. SEE TECH-DEBT.md.
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

// The chunks are in the graph (see the imports above), but React still resolves
// `lazy()` across a suspense boundary, so give the first paint room.
const LAZY_ROUTE = { timeout: 10_000 }

// Page titles are `h2`, and the level is pinned rather than left to the name:
// every page title is ALSO a nav label, so «دفتر درآمد» appears twice in the
// document whenever the ledger is open. Role plus level is what separates the
// title from the rail entry pointing at it.

/**
 * `/ledger` reaches the ledger, inside the shell, with the seeded receipts and
 * a total computed from them.
 *
 * The total is asserted rather than just the rows: a route that renders but
 * totals nothing looks fine in a screenshot.
 */
export const LedgerRoute: Story = {
  parameters: { layout: 'fullscreen', page: { route: '/ledger' } },
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
      const total = new Intl.NumberFormat('fa-IR').format(expected)

      await expect(await canvas.findAllByText('Aria Trading')).not.toHaveLength(0)
      await expect(await canvas.findAllByText((content) => content.includes(total))).not.toHaveLength(0)
    })
  },
}

/**
 * An unknown path lands on the dashboard rather than a blank page.
 *
 * The app is shared as a link. A stale or mistyped URL that dead-ended would
 * look like the app is broken, which for a tool someone is being asked to trust
 * with their income is worse than it sounds.
 */
export const UnknownRouteFallsBackToTheDashboard: Story = {
  parameters: { layout: 'fullscreen', page: { route: '/receipts/1404/march' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 2, name: /نمای کلی درآمد|Income overview/i }, LAZY_ROUTE)).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: CHROME })).toBeInTheDocument()
  },
}

/**
 * `/certificate` renders the printable document and NOTHING else.
 *
 * This route sits outside `AppShell` deliberately: the browser's own print
 * engine turns the page into the PDF, so any nav bar, rail or footer still
 * mounted would be printed onto the document a freelancer hands over. Moving
 * the route inside the shell would break that without breaking anything a
 * screenshot of the app would show.
 */
export const CertificateRendersWithoutTheAppChrome: Story = {
  parameters: { layout: 'fullscreen', page: { route: '/certificate' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: /چاپ|Print/i }, LAZY_ROUTE)).toBeInTheDocument()

    // Every landmark AppShell publishes, absent: `main` is the wrapper the
    // pages render into, `navigation` the rail and the bottom bar, `banner` the
    // top bar. `main` matters most — it is the one the shell cannot render
    // without, so this goes red the moment the certificate route moves inside.
    await expect(canvas.queryByRole('button', { name: CHROME })).toBeNull()
    await expect(canvas.queryByRole('main')).toBeNull()
    await expect(canvas.queryByRole('navigation')).toBeNull()
    await expect(canvas.queryByRole('banner')).toBeNull()
  },
}

/**
 * The four remaining routes, thinly.
 *
 * `path="*"` renders the dashboard, so a route that stopped resolving would not
 * throw — it would quietly serve the dashboard, and a screenshot of the app
 * would look entirely correct. Each of these asserts the page's own `h2`, which
 * is the one thing the fallback cannot produce.
 */
const routeStory = (route: string, title: RegExp): Story => ({
  parameters: { layout: 'fullscreen', page: { route } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 2, name: title }, LAZY_ROUTE)).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: CHROME })).toBeInTheDocument()
  },
})

export const QuickEntryRoute: Story = routeStory('/quick-entry', /^ثبت سریع دریافتی$|^Record a receipt quickly$/)
export const ChartsRoute: Story = routeStory('/charts', /^نمودارها$|^Charts$/)
export const ReportRoute: Story = routeStory('/report', /^گزارش درآمد$|^Income report$/)
export const SettingsRoute: Story = routeStory('/settings', /^تنظیمات$|^Settings$/)
