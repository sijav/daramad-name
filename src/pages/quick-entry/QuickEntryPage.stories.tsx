import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import type { Receipt } from 'src/shared/types'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { QuickEntryPage } from './QuickEntryPage'

// `data` is declared per story rather than on the meta, because Storybook
// MERGES parameters: once the meta seeds the query cache, a story that wants
// the real database cannot switch the seeding off again.
const meta = {
  title: 'Pages/QuickEntry',
  component: QuickEntryPage,
  parameters: { layout: 'fullscreen', page: { route: '/quick-entry' } },
} satisfies Meta<typeof QuickEntryPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scenario 1's 15-second path. Opens on today's date, toman and card-to-card,
 * with the amount autofocused — so the fast path is type, tab, save.
 */
export const Default: Story = { parameters: { page: { data: 'full' } } }

// The scenario stories below drive the REAL database: with nothing seeded into
// the cache every query falls through to Dexie, so what the aside shows is what
// was actually written. Each one starts from an empty database and empties it
// again afterwards, so a scenario cannot leak rows into the next.
const emptyDatabase = async () => {
  const clear = async () => {
    await Promise.all([db.receipts.clear(), db.clients.clear()])
  }
  await clear()
  return clear
}

const now = () => new Date().toISOString()

const tomanReceipt = (id: string, clientId: string, amountToman: number, occurredAt: string): Receipt => ({
  id,
  occurredAt,
  amountOriginal: amountToman,
  currency: 'TOMAN',
  rate: null,
  amountToman,
  clientId,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: occurredAt,
  updatedAt: occurredAt,
})

/** The amount box is the one input in the form that takes a number. */
const amountBox = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLInputElement>('input[inputmode="decimal"]')

/**
 * Scenario 1 end to end: fill the form, save, and check what reached the disk.
 *
 * Asserting the toast would prove only that a promise resolved. What matters is
 * the ROW: `amountToman` is computed once on write and never recomputed, so if
 * the form hands the mutation the wrong amount, currency or date, the error is
 * frozen into every total, chart and certificate from then on with nothing
 * downstream able to detect it.
 */
export const RecordsAReceipt: Story = {
  beforeEach: emptyDatabase,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    // A rendered Persian label first: the write path resolves messages through
    // `i18n._()`, which THROWS rather than falling back if the play function
    // outruns locale activation.
    await canvas.findByText(/^مبلغ دریافتی$|^Amount received$/)

    await step('fill the form', async () => {
      await userEvent.type(amountBox(canvasElement)!, '5000000')
      await userEvent.type(
        await canvas.findByPlaceholderText(/^اسم مشتری را بنویس یا انتخاب کن$|^Type or pick a client name$/),
        'Homa Cafe',
      )
      await userEvent.click(await canvas.findByRole('radio', { name: /^حواله$|^Wire transfer$/ }))
    })

    await step('save', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^ثبت دریافتی$|^Record a receipt$/ }))
      await expect(await canvas.findByText(/^دریافتی ثبت شد\.$|^Receipt saved\.$/)).toBeInTheDocument()
    })

    await step('the stored row carries exactly what was typed', async () => {
      const receipts = await waitFor(async () => {
        const rows = await db.receipts.toArray()
        await expect(rows).toHaveLength(1)
        return rows
      })

      const [saved] = receipts
      await expect(saved.amountOriginal).toBe(5_000_000)
      await expect(saved.currency).toBe('TOMAN')
      // Toman needs no rate, and the frozen equivalent is the amount itself.
      await expect(saved.rate).toBeNull()
      await expect(saved.amountToman).toBe(5_000_000)
      await expect(saved.channel).toBe('REMITTANCE')
      // Defaulted, not typed — the 15-second path depends on it being today.
      await expect(saved.occurredAt.slice(0, 10)).toBe(new Date().toISOString().slice(0, 10))

      const client = await db.clients.get(saved.clientId ?? '')
      await expect(client?.name).toBe('Homa Cafe')
    })
  },
}

/**
 * «ذخیره و بعدی» — the reason a stack of receipts is quick to enter.
 *
 * It has to clear the amount and keep the client: keeping the amount would
 * duplicate the last figure into the next receipt, and clearing the client
 * makes the button pointless. Both failures are silent, and the first one adds
 * money that was never received.
 *
 * The second save is what actually proves it — one client row for two receipts,
 * because a second «Aria Trading» would split the client's totals in the ledger
 * and the charts.
 */
export const SaveAndNextKeepsTheClient: Story = {
  beforeEach: emptyDatabase,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const clientBox = await canvas.findByPlaceholderText(/^اسم مشتری را بنویس یا انتخاب کن$|^Type or pick a client name$/)
    const saveAndNext = await canvas.findByRole('button', { name: /^ذخیره و بعدی$|^Save and next$/ })

    await step('record the first receipt of the batch', async () => {
      await userEvent.type(amountBox(canvasElement)!, '1200000')
      await userEvent.type(clientBox, 'Aria Trading')
      await userEvent.click(await canvas.findByRole('radio', { name: /^تتر$|^Tether$/ }))
      await userEvent.click(saveAndNext)
      await waitFor(async () => await expect(await db.receipts.count()).toBe(1))
    })

    await step('the amount is cleared, the client and channel are kept', async () => {
      await waitFor(async () => await expect(amountBox(canvasElement)!.value).toBe(''))
      await expect(clientBox).toHaveValue('Aria Trading')
      await expect(await canvas.findByRole('radio', { name: /^تتر$|^Tether$/ })).toHaveAttribute('aria-checked', 'true')
    })

    await step('so the next one is only an amount away', async () => {
      await userEvent.type(amountBox(canvasElement)!, '800000')
      await userEvent.click(saveAndNext)
      await waitFor(async () => await expect(await db.receipts.count()).toBe(2))

      const receipts = await db.receipts.toArray()
      await expect(receipts.map((receipt) => receipt.amountToman).sort((left, right) => left - right)).toEqual([800_000, 1_200_000])
      // One client, not two — a duplicate would split Aria Trading's totals.
      await expect(await db.clients.count()).toBe(1)
      await expect(new Set(receipts.map((receipt) => receipt.clientId)).size).toBe(1)
    })
  },
}

/**
 * «خلاصه امروز» is the answer to "did that actually save?", which is the only
 * reason the panel exists. It has to count TODAY, not everything: a total that
 * quietly includes last month's receipts tells the user a receipt landed when
 * it did not, and they stop checking.
 */
export const TodayPanelCountsOnlyToday: Story = {
  beforeEach: async () => {
    const clear = await emptyDatabase()
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 40)

    await db.clients.bulkAdd([
      { id: 'c1', name: 'Homa Cafe', nameKey: 'homa cafe', createdAt: now() },
      { id: 'c2', name: 'Naghsh Studio', nameKey: 'naghsh studio', createdAt: now() },
    ])
    await db.receipts.bulkAdd([
      tomanReceipt('r1', 'c1', 3_500_000, now()),
      tomanReceipt('r2', 'c2', 1_500_000, now()),
      tomanReceipt('r3', 'c1', 99_000_000, lastMonth.toISOString()),
    ])
    return clear
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^خلاصه امروز$|^Today so far$/)

    await step("today's two receipts are summed, and only those two", async () => {
      await expect(await canvas.findByText(/^۵٬۰۰۰٬۰۰۰ تومان$|^5,000,000 Toman$/)).toBeInTheDocument()
      await expect(await canvas.findByText(/^۲ دریافتی$|^2 receipts$/)).toBeInTheDocument()
      // The 40-day-old receipt is outside today and must not appear anywhere in
      // the panel — not in the total, and not as the "last receipt".
      await expect(canvas.queryByText(/۹۹٬۰۰۰٬۰۰۰|99,000,000/)).toBeNull()
    })

    await step('the clients already recorded are offered for the next entry', async () => {
      const heading = await canvas.findByText(/^مشتری‌های اخیر$|^Recent clients$/)
      // Scoped to the panel: the client name also appears in «آخرین دریافتی».
      const panel = within(heading.closest('.MuiPaper-root')!)
      await expect(await panel.findByText('Homa Cafe')).toBeInTheDocument()
      await expect(await panel.findByText('Naghsh Studio')).toBeInTheDocument()
    })
  },
}
