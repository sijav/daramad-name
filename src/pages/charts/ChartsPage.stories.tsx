import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { db } from 'src/core/db'
import type { Receipt } from 'src/shared/types'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ChartsPage } from './ChartsPage'

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

// `data` is declared per story rather than on the meta, because Storybook MERGES
// parameters: a story that wants the real database cannot switch the seeding off
// again once the meta has turned it on.
const meta = {
  title: 'Pages/Charts',
  component: ChartsPage,
  parameters: { ...CHART_A11Y, layout: 'fullscreen', page: { route: '/charts' } },
} satisfies Meta<typeof ChartsPage>

export default meta
type Story = StoryObj<typeof meta>

const seeded = { page: { data: 'full' } }

export const WithData: Story = { parameters: seeded }

export const Empty: Story = {
  parameters: { page: { data: 'empty', route: '/charts' } },
  render: () => (
    <Routes>
      <Route path="/charts" element={<ChartsPage />} />
      <Route path="/quick-entry" element={<h1>the quick entry page</h1>} />
    </Routes>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^برای این سال هنوز داده‌ای نیست$|^No data for this year yet$/)).toBeInTheDocument()
    // No axis, no donut, no ranked list, nothing that would imply a chart is
    // being shown and simply happens to be flat.
    await expect(canvas.queryByText(/فروردین|Farvardin/)).toBeNull()
    await expect(canvas.queryByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeNull()

    // Two buttons carry this label, the header's permanent action and the
    // empty state's own call to action. The empty state's is the later one.
    const actions = await canvas.findAllByRole('button', { name: /^ثبت دریافتی$|^Record a receipt$/ })
    await userEvent.click(actions[actions.length - 1])
    await expect(await canvas.findByRole('heading', { name: 'the quick entry page' })).toBeInTheDocument()
  },
}

export const ShowsTheWholeYearAndTheRisk: Story = {
  parameters: seeded,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // All twelve Jalali months are on the axis, including the quiet ones.
    const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    for (const month of MONTHS) {
      await expect(await canvas.findAllByText(new RegExp(month))).not.toHaveLength(0)
    }

    // The dependency warning is present and names a share.
    const insight = await canvas.findByText(/درآمدت از یک مشتری/)
    await expect(insight).toBeInTheDocument()
    await expect(insight.textContent).toMatch(/[۰-۹]+٪/)
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

export const ConcentrationStaysQuietWhenSpread: Story = {
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

    // Everything here came from Dexie, so wait for the charts before concluding
    // anything from an absence.
    await expect(await canvas.findByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeInTheDocument()
    // The leader is named on three surfaces here, the donut's centre overlay,
    // its legend, and the ranked list, and which paints first is a race.
    // `findAllByText` resolves as soon as ONE matches, so pinning an exact
    // count only recorded whichever moment the assertion happened to catch.
    // More than one is what actually proves the client surfaces have loaded,
    // which is the precondition for reading anything into the absence below.
    await waitFor(async () => {
      await expect((await canvas.findAllByText('Aria Trading')).length).toBeGreaterThan(1)
    })

    await expect(canvas.queryByText(/درآمدت از یک مشتری|of your income comes from a single client/)).toBeNull()
  },
}
