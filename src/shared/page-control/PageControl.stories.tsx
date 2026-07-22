import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
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
