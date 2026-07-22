import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PageControl } from './PageControl'

const meta = { title: 'Shared/PageControl', component: PageControl } satisfies Meta<typeof PageControl>
export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [page, setPage] = useState(args.page)
  const [pageSize, setPageSize] = useState(args.pageSize)
  const pageCount = Math.ceil(args.totalCount / pageSize)
  return (
    <PageControl
      {...args}
      page={Math.min(page, pageCount)}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  )
}

/** The row-range sentence matters: a page number alone does not say whether the filter matched 12 receipts or 126. */
export const ManyPages: Story = {
  args: { page: 1, pageCount: 6, pageSize: 25, totalCount: 126, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

export const SinglePage: Story = {
  args: { page: 1, pageCount: 1, pageSize: 25, totalCount: 13, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

/** Zero results still renders, so the control does not vanish under an empty filter. */
export const NoResults: Story = {
  args: { page: 1, pageCount: 1, pageSize: 25, totalCount: 0, onPageChange: fn(), onPageSizeChange: fn() },
  render: Controlled,
}

/**
 * The row-range sentence is arithmetic, and arithmetic that is quietly off by a
 * page is the kind of thing nobody reports: the table still shows rows, they are
 * just described wrongly. Both ends are checked on a middle page and on the last
 * one, where `lastRow` has to clamp to the total rather than run to 150.
 */
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

/**
 * Changing rows-per-page has to actually re-slice the range. It also proves the
 * select reports a NUMBER: `Number(event.target.value)` is the only thing
 * standing between the option and a string page size, and `"10"` would make
 * every downstream `page * pageSize` produce garbage.
 */
export const ChangingRowsPerPageReslices: Story = {
  ...ManyPages,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await canvas.findByText(/^نمایش ۱ تا ۲۵ از ۱۲۶ دریافتی$|^Showing 1 to 25 of 126 receipts$/)

    // The select's menu is portalled, so the option is not in the canvas.
    await userEvent.click(await canvas.findByRole('combobox'))
    await userEvent.click(await body.findByRole('option', { name: /^۱۰ ردیف در صفحه$|^10 rows per page$/ }))

    await waitFor(async () =>
      expect(await canvas.findByText(/^نمایش ۱ تا ۱۰ از ۱۲۶ دریافتی$|^Showing 1 to 10 of 126 receipts$/)).toBeInTheDocument(),
    )
  },
}

/**
 * An empty result set must read "0 to 0", not "1 to 0". The guard is a single
 * ternary and its absence produces a sentence that claims a row exists.
 */
export const EmptyRangeReadsZero: Story = {
  ...NoResults,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/^نمایش ۰ تا ۰ از ۰ دریافتی$|^Showing 0 to 0 of 0 receipts$/)).toBeInTheDocument()
  },
}
