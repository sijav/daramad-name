import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import type { Receipt } from 'src/shared/types'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { LedgerPage } from './LedgerPage'

// Pagination needs more receipts than a page holds, and the smallest page size
// is 10, more than the eight shared fixtures. So these stories add their own
// bulk rows on top of the fixtures and read the table straight out of Dexie.
//
// `page` carries only a route here, deliberately: `data: 'full'` would seed the
// query cache with the eight-receipt fixture ledger, and every story below would
// then assert against the seed instead of the twenty-eight rows in the database.

const BULK_COUNT = 20
const TOTAL = FIXTURE_RECEIPTS.length + BULK_COUNT

/** Dated 2020 so they sort below every fixture receipt and page 1 stays predictable. */
const BULK: Receipt[] = Array.from({ length: BULK_COUNT }, (_unused, index) => {
  const occurredAt = new Date(Date.UTC(2020, 0, index + 1, 12)).toISOString()
  return {
    id: `bulk-${index}`,
    occurredAt,
    amountOriginal: 1_000_000,
    currency: 'TOMAN',
    rate: null,
    amountToman: 1_000_000,
    clientId: null,
    channel: 'OTHER',
    note: `bulk ${index}`,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  }
})

const seedManyReceipts = async () => {
  const clear = await seedDatabase()
  await db.receipts.bulkAdd(BULK)
  return clear
}

const meta = {
  title: 'Pages/Ledger/Pagination',
  component: LedgerPage,
  parameters: { layout: 'fullscreen', page: { route: '/ledger' } },
  beforeEach: async () => await seedManyReceipts(),
} satisfies Meta<typeof LedgerPage>

export default meta
type Story = StoryObj<typeof meta>

const dataRows = (canvasElement: HTMLElement): HTMLTableRowElement[] => [
  ...(canvasElement.querySelectorAll('tbody')[0]?.querySelectorAll('tr') ?? []),
]

const rowsPerPage = async (canvasElement: HTMLElement, option: RegExp) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(await canvas.findByRole('combobox'))
  await userEvent.click(await body.findByRole('option', { name: option }))
}

export const TwoPages: Story = {}

export const TotalCountsEveryMatchNotJustThePage: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the page holds twenty-five rows', async () => {
      await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۲۸ دریافتی$|^Showing 1 to 25 of 28 receipts$/)
      await expect(dataRows(canvasElement)).toHaveLength(25)
    })

    await step('but every headline number describes all twenty-eight', async () => {
      await expect(await canvas.findByText(/^جمع کل ۲۸ دریافتی$|^Total of 28 receipts$/)).toBeInTheDocument()
      await expect(await canvas.findByText(/^۲۸ نتیجه$|^28 results?$/)).toBeInTheDocument()
      await expect(canvas.queryByText(/^جمع کل ۲۵ دریافتی$|^Total of 25 receipts$/)).toBeNull()
    })
  },
}

export const SecondPageShowsTheRemainingRows: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۲۸ دریافتی$|^Showing 1 to 25 of 28 receipts$/)
    const firstPageTop = dataRows(canvasElement)[0].textContent

    await step('go to the second page', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: new RegExp('صفحه' + '‌' + 'ی ۲$|page 2$') }))
      await canvas.findByText(/^نمایش ۲۶ تا ۲۸ از ۲۸ دریافتی$|^Showing 26 to 28 of 28 receipts$/)
    })

    await step('it holds the three rows page one did not', async () => {
      await expect(dataRows(canvasElement)).toHaveLength(TOTAL - 25)
      await expect(dataRows(canvasElement)[0].textContent).not.toBe(firstPageTop)
      // The total still describes the whole set, not this three-row page.
      await expect(await canvas.findByText(/^جمع کل ۲۸ دریافتی$|^Total of 28 receipts$/)).toBeInTheDocument()
    })
  },
}

export const ChangingPageSizeReturnsToTheFirstPage: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۲۸ دریافتی$|^Showing 1 to 25 of 28 receipts$/)

    await step('stand on page two', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: new RegExp('صفحه' + '‌' + 'ی ۲$|page 2$') }))
      await canvas.findByText(/^نمایش ۲۶ تا ۲۸ از ۲۸ دریافتی$|^Showing 26 to 28 of 28 receipts$/)
    })

    await step('shrinking the page starts again from the first row', async () => {
      await rowsPerPage(canvasElement, /^۱۰ ردیف در صفحه$|^10 rows per page$/)
      // Ten per page still HAS a page two (rows 11, 20), so staying put would be
      // silent: the sentence is what distinguishes reset from carried-over.
      await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۲۸ دریافتی$|^Showing 1 to 10 of 28 receipts$/)
      await expect(dataRows(canvasElement)).toHaveLength(10)
    })
  },
}

export const ClearAllResetsFilterSearchAndPage: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۲۸ دریافتی$|^Showing 1 to 25 of 28 receipts$/)

    await step('ten rows a page', async () => {
      await rowsPerPage(canvasElement, /^۱۰ ردیف در صفحه$|^10 rows per page$/)
      await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۲۸ دریافتی$|^Showing 1 to 10 of 28 receipts$/)
    })

    await step('filter to the twenty "other" receipts', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^فیلترها|^Filters/ }))
      await userEvent.click(await body.findByRole('combobox', { name: /^کانال$|^Channel$/ }))
      await userEvent.click(await body.findByRole('option', { name: /^دیگر$|^Other$/ }))
      await userEvent.click(await body.findByRole('button', { name: /^اعمال فیلترها$|^Apply filters$/ }))
      await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۲۰ دریافتی$|^Showing 1 to 10 of 20 receipts$/)
    })

    await step('search within them, then walk to page two', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: /^جست‌وجو در دریافتی‌ها$|^Search receipts$/ }), 'bulk')
      await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۲۰ دریافتی$|^Showing 1 to 10 of 20 receipts$/)
      await userEvent.click(await canvas.findByRole('button', { name: new RegExp('صفحه' + '‌' + 'ی ۲$|page 2$') }))
      await canvas.findByText(/^نمایش ۱۱ تا ۲۰ از ۲۰ دریافتی$|^Showing 11 to 20 of 20 receipts$/)
    })

    await step('clear all drops the filter, the search AND the page together', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^پاک کردن همه$|^Clear all$/ }))

      await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۲۸ دریافتی$|^Showing 1 to 10 of 28 receipts$/)
      await expect(canvas.queryByText(/^کانال: دیگر$|^Channel: Other$/)).toBeNull()
      await expect(await canvas.findByRole('textbox', { name: /^جست‌وجو در دریافتی‌ها$|^Search receipts$/ })).toHaveValue('')
      // The rows-per-page choice is the user's, not part of the filter, it stays.
      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(10))
    })
  },
}

export const NoResultsIsNotTheSameAsAnEmptyLedger: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۲۸ دریافتی$|^Showing 1 to 25 of 28 receipts$/)

    await userEvent.type(await canvas.findByRole('textbox', { name: /^جست‌وجو در دریافتی‌ها$|^Search receipts$/ }), 'no receipt says this')

    // The recovery offered is "clear the filters", not "record your first receipt".
    await expect(await canvas.findByText(/^با این فیلترها چیزی پیدا نشد$|^Nothing matched these filters$/)).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: /^پاک کردن فیلترها$|^Clear filters$/ })).toBeInTheDocument()
    await expect(canvas.queryByRole('table')).toBeNull()
  },
}
