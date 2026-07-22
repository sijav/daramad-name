import type { Meta, StoryObj } from '@storybook/react-vite'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, userEvent, within } from 'storybook/test'
import { LedgerPage } from './LedgerPage'

const meta = {
  title: 'Pages/Ledger',
  component: LedgerPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/ledger' } },
} satisfies Meta<typeof LedgerPage>

export default meta
type Story = StoryObj<typeof meta>

/** Scenario 2: the toolbar, the totals that track the filter, and the paginated table. */
export const WithData: Story = {}

/** Nothing recorded yet — distinct from a filter that matched nothing. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/ledger' } } }

/**
 * Scenario 2, end to end through the real query.
 *
 * "How much did this one client pay me?" is the question the ledger exists to
 * answer, and the running total tracking the filter is what makes the answer
 * trustworthy. This seeds IndexedDB rather than the query cache: applying a
 * filter changes the query key, so a cache-only story would miss, fall through
 * to an empty database, and pass while proving nothing.
 */
export const FiltersByClientAndRetotals: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const CLIENT = 'Aria Trading'
    const owed = FIXTURE_RECEIPTS.filter((receipt) => receipt.clientName === CLIENT)
    const expected = owed.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await step('open the filter popover', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /فیلترها|Filters/i }))
    })

    await step(`filter to ${CLIENT}`, async () => {
      // The popover renders in a portal, so query the document, not the canvas.
      const body = within(canvasElement.ownerDocument.body)
      await userEvent.type(await body.findByRole('combobox', { name: /مشتری|Client/i }), CLIENT)
      await userEvent.click(await body.findByRole('option', { name: new RegExp(CLIENT, 'i') }))
      await userEvent.click(await body.findByRole('button', { name: /اعمال|Apply/i }))
    })

    await step('the table, the count and the total all follow the filter', async () => {
      const body = within(canvasElement.ownerDocument.body)
      // Every visible row belongs to that client.
      await expect(await body.findAllByText(CLIENT)).toHaveLength(owed.length)
      // And the total is that client's, not the whole ledger's.
      const total = new Intl.NumberFormat('fa-IR').format(expected)
      await expect(await body.findAllByText((content) => content.includes(total))).not.toHaveLength(0)
    })
  },
}

/**
 * Search accepts PERSIAN numerals.
 *
 * A Persian keyboard types «۱۸۰۰۰۰۰۰», the amount is stored as 18000000, and a
 * naive `includes` would find nothing — the user would conclude the receipt was
 * never recorded. The normalisation that prevents that is one call deep and
 * silent when it breaks, so it gets its own assertion.
 */
export const SearchesByPersianNumerals: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const target = FIXTURE_RECEIPTS.find((receipt) => receipt.amountToman === 18_000_000)!

    await step('type the amount in Persian digits', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: /جست|Search receipts/i }), '۱۸۰۰۰۰۰۰')
    })

    await step('the one matching receipt is found', async () => {
      await expect(await canvas.findAllByText(target.clientName!)).toHaveLength(1)
      // And the result count agrees with the table rather than the pre-search set.
      await expect(await canvas.findByText(/^۱ نتیجه$|^1 results?$/)).toBeInTheDocument()
    })
  },
}
