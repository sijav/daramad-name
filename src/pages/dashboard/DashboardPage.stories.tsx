import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { db } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import { FIXTURE_MONTHS } from 'src/shared/story-fixtures'
import type { Receipt } from 'src/shared/types'
import { monthIndexOf, monthNames, toEnglishDigits, toPersianDigits, yearOf } from 'src/shared/utils'
import { expect, userEvent, within } from 'storybook/test'
import { DashboardPage } from './DashboardPage'

// The `page` parameter drives the decorator in `.storybook/preview.tsx`: it
// supplies a router, and when `data` is set it seeds the query cache so the
// page renders without touching IndexedDB.
//
// `data` sits on each story rather than on the meta because Storybook MERGES
// parameters: once the meta turns seeding on, a story that wants the real
// database (`ConcentrationInsightStaysQuietWhenSpread`) cannot turn it off.

// MUI X's `ChartsAccessibilityProxy` renders two `role="img"` divs pointing at
// `voiceover-<chartId>-1|2` elements it creates EMPTY and fills only while the
// chart has keyboard focus, so at rest axe sees an unnamed image on every
// chart. The only fixes are `disableKeyboardNavigation` or writing into MUI X
// internals. This rule only, in the four chart story files. See TECH-DEBT.md.
const CHART_A11Y = { a11y: { config: { rules: [{ id: 'role-img-alt', enabled: false }] } } }

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
  parameters: { ...CHART_A11Y, layout: 'fullscreen', page: {} },
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

const seeded = { page: { data: 'full' } }
const emptied = { page: { data: 'empty' } }

export const WithData: Story = {
  parameters: seeded,
  // The concentration warning is asserted present here and absent in
  // `ConcentrationInsightStaysQuietWhenSpread`; one that never fires and one
  // that always fires look identical on a single screen.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const insight = await canvas.findByText(/درآمدت از یک مشتری|of your income comes from a single client/)
    await expect(insight.textContent).toMatch(/[۰-۹\d]+٪|[۰-۹\d]+%/)
  },
}

export const Empty: Story = { parameters: emptied }

// The figure on a card, read back out of the rendered text. `MoneyText` is the
// only element in a card that carries a `dir`, which is what separates the
// figure from its label.
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
      // The fixture seeds all twelve buckets, but only the elapsed ones may be
      // summed: months that have not happened inflate a numerator the divisor
      // does not count. The cut-off is the divisor the page PRINTED, not one
      // recomputed here, so the test cannot repeat the page's arithmetic and
      // pass alongside it.
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
      // One label carrying both the month name and the year. Matched on parts
      // so it survives translation, and `findByText` reads an element's own
      // text only, so an ancestor holding the two in separate children cannot
      // satisfy it.
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
  parameters: emptied,
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

const tomanReceipt = (id: string, clientId: string, amountToman: number): Receipt => {
  const now = new Date().toISOString()

  return {
    id,
    occurredAt: now,
    amountOriginal: amountToman,
    currency: 'TOMAN',
    rate: null,
    amountToman,
    clientId,
    channel: 'CARD_TO_CARD',
    note: null,
    createdAt: now,
    updatedAt: now,
  }
}

const clearDatabase = async (): Promise<void> => {
  await Promise.all([db.receipts.clear(), db.clients.clear()])
}

export const ConcentrationInsightStaysQuietWhenSpread: Story = {
  // The only story here that runs against the real database: the threshold has
  // to be exercised, not read back out of a fixture that hard-codes the answer.
  beforeEach: async () => {
    await clearDatabase()

    const names = ['Aria Trading', 'Homa Cafe', 'Naghsh Studio', 'Dadepardaz Co.']
    const createdAt = new Date().toISOString()
    // `bulkPut`, not `bulkAdd`: a Docs page renders every story at once and
    // these ids are fixed, so an overlapping re-seed would fail the whole batch
    // with «Key already exists in the object store».
    await db.clients.bulkPut(names.map((name, index) => ({ id: `c${index}`, name, nameKey: name.toLowerCase(), createdAt })))
    await db.receipts.bulkPut(names.map((_name, index) => tomanReceipt(`r${index}`, `c${index}`, 25_000_000)))

    return clearDatabase
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // This page reads from Dexie, so wait for the figures before concluding
    // anything from an absence.
    await expect(figureIn(await cardFor(canvasElement, /^درآمد سال |^Income in /))).toBe(100_000_000)
    await expect(await canvas.findByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeInTheDocument()

    await expect(canvas.queryByText(/درآمدت از یک مشتری|of your income comes from a single client/)).toBeNull()
  },
}
