import type { Meta, StoryObj } from '@storybook/react-vite'
import { FIXTURE_RECEIPTS } from 'src/shared/story-fixtures'
import { expect, within } from 'storybook/test'
import { RecentReceipts } from './RecentReceipts'

const meta = {
  title: 'Pages/Dashboard/RecentReceipts',
  component: RecentReceipts,
  parameters: { layout: 'padded' },
  args: { receipts: FIXTURE_RECEIPTS.slice(0, 4) },
} satisfies Meta<typeof RecentReceipts>

export default meta
type Story = StoryObj<typeof meta>

export const WithReceipts: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^۵۰۰[٫.]۰۰ تتر$|^500\.00 Tether$/)).toBeInTheDocument()
    await expect(await canvas.findByText(/^۴۹٬۲۵۰٬۰۰۰$|^49,250,000$/)).toBeInTheDocument()
    // A Toman receipt has no conversion, so both columns read the same figure —
    // 18,000,000 appears twice rather than being blanked out on one side.
    await expect(await canvas.findAllByText(/^۱۸٬۰۰۰٬۰۰۰( تومان)?$|^18,000,000( Toman)?$/)).toHaveLength(2)
  },
}

export const Empty: Story = {
  args: { receipts: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^در این بازه هنوز چیزی ثبت نشده\.$|^Nothing recorded in this range yet\.$/)).toBeInTheDocument()
    await expect(canvas.queryByRole('table')).toBeNull()
  },
}
