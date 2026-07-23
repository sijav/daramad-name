import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PageControl } from './PageControl'

const meta = {
  title: 'Shared/PageControl',
  component: PageControl,
  argTypes: {
    // Derived by the harness from `totalCount` and the live page size, the way
    // `useLedgerView` derives it. An editable second copy could only contradict
    // the row-range sentence, and every story's value was already discarded.
    pageCount: {
      control: false,
      table: { disable: true },
    },
  },
} satisfies Meta<typeof PageControl>
export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [page, setPage] = useState(args.page)
  const [pageSize, setPageSize] = useState(args.pageSize)
  // `Math.max(1, …)` is what the ledger does (useLedgerView). Without it an
  // empty filter gives a page count of 0, and the harness then hands the
  // control `page={0}`, a state production cannot reach, where the single
  // page button renders unselected.
  const pageCount = Math.max(1, Math.ceil(args.totalCount / pageSize))
  return (
    <PageControl
      {...args}
      page={Math.min(page, pageCount)}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={(next) => {
        setPage(next)
        args.onPageChange(next)
      }}
      onPageSizeChange={(next) => {
        setPageSize(next)
        args.onPageSizeChange(next)
      }}
    />
  )
}

export const ManyPages: Story = {
  args: { page: 1, pageCount: 6, pageSize: 25, totalCount: 126, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

export const SinglePage: Story = {
  args: { page: 1, pageCount: 1, pageSize: 25, totalCount: 13, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

export const NoResults: Story = {
  args: { page: 1, pageCount: 1, pageSize: 25, totalCount: 0, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

export const RowRangeFollowsThePage: Story = {
  ...ManyPages,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the first page starts at one', async () => {
      await expect(await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۱۲۶ دریافتی$|^Showing 1 to 25 of 126 receipts$/)).toBeInTheDocument()
    })

    await step('a middle page reports its own slice', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: new RegExp('صفحه' + '‌' + 'ی ۲$|page 2$') }))
      await expect(await canvas.findByText(/^نمایش ۲۶ تا ۵۰ از ۱۲۶ دریافتی$|^Showing 26 to 50 of 126 receipts$/)).toBeInTheDocument()
    })

    await step('the last page stops at the total, not at page × pageSize', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: new RegExp('صفحه' + '‌' + 'ی ۶$|page 6$') }))
      // 6 × 25 is 150; the sentence must still end at 126.
      await expect(await canvas.findByText(/^نمایش ۱۲۶ تا ۱۲۶ از ۱۲۶ دریافتی$|^Showing 126 to 126 of 126 receipts$/)).toBeInTheDocument()
    })
  },
}

export const ChangingRowsPerPageReslices: Story = {
  ...ManyPages,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۱۲۶ دریافتی$|^Showing 1 to 25 of 126 receipts$/)

    // The select's menu is portalled, so the option is not in the canvas.
    await userEvent.click(await canvas.findByRole('combobox'))
    await userEvent.click(await body.findByRole('option', { name: /^۱۰ ردیف در صفحه$|^10 rows per page$/ }))

    await waitFor(async () =>
      expect(await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۱۲۶ دریافتی$|^Showing 1 to 10 of 126 receipts$/)).toBeInTheDocument(),
    )

    // `10`, not `"10"`, the strict matcher is the assertion. What the footer
    // displays and what it reports upward are two different values, and only
    // the second one reaches the ledger's slice.
    await expect(args.onPageSizeChange).toHaveBeenLastCalledWith(10)
  },
}

export const EmptyRangeReadsZero: Story = {
  ...NoResults,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the sentence counts from zero', async () => {
      await expect(await canvas.findByText(/^نمایش ۰ تا ۰ از ۰ دریافتی$|^Showing 0 to 0 of 0 receipts$/)).toBeInTheDocument()
    })

    // Zero results is still page one of one. Dropping the `Math.max(1, …)` the
    // ledger applies gives a page count of 0, and the footer then renders its
    // single page button with nothing selected, a state the app cannot reach.
    await step('and page one is still the current page', async () => {
      const current = new RegExp('^صفحه' + '‌' + 'ی ۱، صفحه' + '‌' + 'ی فعلی$|^Page 1, current page$')
      await expect(await canvas.findByRole('button', { name: current })).toBeInTheDocument()
    })
  },
}
