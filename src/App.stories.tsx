import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { queryClient } from 'src/core/query'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, within } from 'storybook/test'
import { App } from './App'

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

const meta = {
  title: 'App',
  component: App,
  parameters: { layout: 'fullscreen', page: { route: '/' } },
  beforeEach: boot,
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

const CHROME = /تغییر تم|Switch theme/i

// Every route but the dashboard is a lazy chunk, and the dev server compiles it
// on first request. That is slower than the default one-second query timeout,
// and it is a property of the harness rather than of the app.
const LAZY_ROUTE = { timeout: 10_000 }

// Page titles are `h2`. The level is pinned because the nav rail's own labels
// come out as headings too — `ListItemText` renders its `subtitle2` variant as
// an `h6` — so «دفتر درآمد» exists twice in the document while the ledger is open.

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

    await expect(canvas.queryByRole('button', { name: CHROME })).toBeNull()
    await expect(canvas.queryByRole('navigation')).toBeNull()
    await expect(canvas.queryByRole('banner')).toBeNull()
  },
}
