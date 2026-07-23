import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { db } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import { FIXTURE_MONTHS } from 'src/shared/story-fixtures'
import type { Receipt } from 'src/shared/types'
import { monthIndexOf, monthNames, toEnglishDigits, toPersianDigits, yearOf } from 'src/shared/utils'
import { expect, userEvent, within } from 'storybook/test'
import { DashboardPage } from './DashboardPage'

/**
 * Page stories render entirely from a seeded query cache, no IndexedDB. The
 * `page` parameter tells the global decorator to seed fixtures and supply a
 * router, so these are deterministic across runs and languages.
 *
 * `data` is declared per story rather than here, because Storybook MERGES
 * parameters: a story asking for the real database cannot switch the seeding
 * off again once the meta has turned it on.
 */
// `role-img-alt` is switched off HERE ONLY, and it is upstream rather than ours.
//
// MUI X renders `ChartsAccessibilityProxy`: two `role="img"` divs pointing at
// `voiceover-<chartId>-1|2` elements that the library creates EMPTY and fills
// only while the chart has keyboard focus. It is a live-region proxy for
// keyboard navigation, not a static image label, so at rest axe correctly sees
// `role="img"` with an empty name, on every chart, in every story.
//
// The only ways to satisfy the rule are to pass `disableKeyboardNavigation`,
// which removes a real accessibility feature to please a checker, or to write
// into MUI X's internal divs. Both are worse than the finding. Every other axe
// rule stays enforced. SEE TECH-DEBT.md.
const CHART_A11Y = { a11y: { config: { rules: [{ id: 'role-img-alt', enabled: false }] } } }

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
  parameters: { ...CHART_A11Y, layout: 'fullscreen', page: {} },
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

const seeded = { page: { data: 'full' } }

export const WithData: Story = {
  parameters: seeded,
  /**
   * The dependency warning is a claim about the user's business, so it may only
   * appear when it is true. It is rendered here and asserted absent in
   * `ConcentrationInsightStaysQuietWhenSpread`, both branches, because a
   * warning that never fires and one that always fires look identical on a
   * single screen.
   */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const insight = await canvas.findByText(/درآمدت از یک مشتری|of your income comes from a single client/)
    await expect(insight.textContent).toMatch(/[۰-۹\d]+٪|[۰-۹\d]+%/)
  },
}

export const Empty: Story = { parameters: { page: { data: 'empty' } } }

// The money on a card, read back out of the rendered text rather than from the
// props that produced it. `MoneyText` is the only element on a card that
// carries a `dir`, which is what separates the figure from its label.
const figureIn = (card: Element | null | undefined): number =>
  Number(toEnglishDigits(card?.querySelector('[dir]')?.textContent ?? '').replace(/\D/g, ''))

const cardFor = async (canvasElement: HTMLElement, label: RegExp): Promise<Element | null> =>
  (await within(canvasElement).findByText(label)).closest('.MuiPaper-root')

export const MonthlyAverageStatesItsDivisor: Story = {
  parameters: seeded,
  play: async ({ canvasElement, step }) => {
    const averageCard = await cardFor(canvasElement, /^میانگین ماهانه$|^Monthly average$/)
    const totalCard = await cardFor(canvasElement, /^درآمد سال |^Income in /)
    let divisor = 0

    await step('the divisor is stated on the card, in words', async () => {
      const hint = /(?:تقسیم بر|divided by)\s*([۰-۹\d]+)\s*(?:ماه|months)/.exec(averageCard?.textContent ?? '')
      await expect(hint).not.toBeNull()

      divisor = Number(toEnglishDigits(hint![1]))
      await expect(divisor).toBeGreaterThan(0)
      await expect(divisor).toBeLessThanOrEqual(12)

      // The printed average is the printed total over the printed divisor.
      await expect(figureIn(averageCard)).toBe(Math.round(figureIn(totalCard) / divisor))
    })

    await step('and the total covers exactly the months the divisor counts', async () => {
      // The fixture seeds all twelve buckets of the year, but only the elapsed
      // ones may be summed, a numerator carrying months that have not happened
      // over a divisor that does not count them inflates the average, which is
      // the one figure on this page nobody can sanity-check by eye.
      //
      // The month cut-off is taken from the divisor the page PRINTED rather
      // than recomputed here, so this cannot pass by making the same mistake
      // twice. Derived from the fixture rather than written out: the months
      // carry varied receipt counts and a couple of empty ones, and the empty
      // ones belong in the divisor while contributing nothing to the total.
      const expected = FIXTURE_MONTHS(yearOf(new Date(), 'JALALI'))
        .filter((month) => month.month <= divisor)
        .reduce((sum, month) => sum + month.totalToman, 0)
      await expect(figureIn(totalCard)).toBe(expected)
    })
  },
}

export const APastYearNamesTheMonthOnTheCard: Story = {
  parameters: seeded,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const previous = yearOf(new Date(), 'JALALI') - 1
    const month = monthNames('JALALI', i18n)[monthIndexOf(new Date(), 'JALALI')]

    await step('on the current year the card says "this month"', async () => {
      await expect(await canvas.findByText(/^درآمد این ماه$|^Income this month$/)).toBeInTheDocument()
    })

    await step('pick the year before', async () => {
      await userEvent.click(await canvas.findByRole('combobox'))
      await userEvent.click(await body.findByRole('option', { name: new RegExp(`(${previous}|${toPersianDigits(previous)})$`) }))
    })

    await step('and the card names the month it is actually showing', async () => {
      await expect(canvas.queryByText(/^درآمد این ماه$|^Income this month$/)).toBeNull()
      // Month name AND year in ONE label. Matched on parts rather than on the
      // whole sentence so the assertion survives translation and works in
      // either language; `getNodeText` reads only an element's own text, so an
      // ancestor holding both in different children cannot satisfy it.
      const relabelled = await canvas.findByText(
        (content) => content.includes(month) && toEnglishDigits(content).includes(String(previous)),
      )
      await expect(relabelled).toBeInTheDocument()
    })
  },
}

export const LatestReceiptsLinkToTheLedger: Story = {
  parameters: seeded,
  render: () => (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/ledger" element={<h1>the ledger page</h1>} />
    </Routes>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the six most recent receipts, and no more', async () => {
      const rows = await canvas.findAllByRole('row')
      // Six receipts plus the header row.
      await expect(rows).toHaveLength(7)
      // The seventh-newest receipt is 161,100,000 Toman and must not be here.
      await expect(canvas.queryByText(/۱۶۱٬۱۰۰٬۰۰۰|161,100,000/)).toBeNull()
    })

    await step('a foreign receipt shows what was received AND what it is worth', async () => {
      await expect(await canvas.findByText(/^۵۰۰[٫.]۰۰ تتر$|^500\.00 Tether$/)).toBeInTheDocument()
      // 500 x 98,500, frozen at the moment of entry.
      await expect(await canvas.findByText(/^۴۹٬۲۵۰٬۰۰۰$|^49,250,000$/)).toBeInTheDocument()
    })

    await step('«مشاهده همه» goes to the ledger', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^مشاهده همه$|^View all$/ }))
      await expect(await canvas.findByRole('heading', { name: 'the ledger page' })).toBeInTheDocument()
    })
  },
}

export const EmptyStateLeadsToQuickEntry: Story = {
  parameters: { page: { data: 'empty' } },
  render: () => (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/quick-entry" element={<h1>the quick entry page</h1>} />
    </Routes>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^برای این سال هنوز درآمدی ثبت نشده$|^No income recorded for this year yet$/)).toBeInTheDocument()
    // No summary cards and no chart panel: nothing to average, nothing to plot.
    await expect(canvas.queryByText(/^میانگین ماهانه$|^Monthly average$/)).toBeNull()
    await expect(canvas.queryByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeNull()

    // Two buttons carry this label, the header's permanent action and the
    // empty state's own call to action. The empty state's is the later one.
    const actions = await canvas.findAllByRole('button', { name: /^ثبت دریافتی$|^Record a receipt$/ })
    await userEvent.click(actions[actions.length - 1])
    await expect(await canvas.findByRole('heading', { name: 'the quick entry page' })).toBeInTheDocument()
  },
}

const tomanReceipt = (id: string, clientId: string, amountToman: number): Receipt => ({
  id,
  occurredAt: new Date().toISOString(),
  amountOriginal: amountToman,
  currency: 'TOMAN',
  rate: null,
  amountToman,
  clientId,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const ConcentrationInsightStaysQuietWhenSpread: Story = {
  beforeEach: async () => {
    const clear = async () => {
      await Promise.all([db.receipts.clear(), db.clients.clear()])
    }
    await clear()

    const names = ['Aria Trading', 'Homa Cafe', 'Naghsh Studio', 'Dadepardaz Co.']
    await db.clients.bulkAdd(
      names.map((name, index) => ({ id: `c${index}`, name, nameKey: name.toLowerCase(), createdAt: new Date().toISOString() })),
    )
    await db.receipts.bulkAdd(names.map((_name, index) => tomanReceipt(`r${index}`, `c${index}`, 25_000_000)))

    return clear
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Everything on this page came from Dexie, so wait for the figures before
    // concluding anything from an absence.
    await expect(figureIn(await cardFor(canvasElement, /^درآمد سال |^Income in /))).toBe(100_000_000)
    await expect(await canvas.findByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeInTheDocument()

    await expect(canvas.queryByText(/درآمدت از یک مشتری|of your income comes from a single client/)).toBeNull()
  },
}
