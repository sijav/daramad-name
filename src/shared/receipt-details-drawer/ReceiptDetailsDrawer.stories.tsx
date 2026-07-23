import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ReceiptDetailsDrawer } from './ReceiptDetailsDrawer'

const meta = {
  title: 'Shared/ReceiptDetailsDrawer',
  component: ReceiptDetailsDrawer,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ReceiptDetailsDrawer>

export default meta
type Story = StoryObj<typeof meta>

const receipt = (overrides: Partial<ReceiptWithClient>): ReceiptWithClient => ({
  id: 'story',
  occurredAt: new Date().toISOString(),
  amountOriginal: 18000000,
  currency: 'TOMAN',
  rate: null,
  amountToman: 18000000,
  clientId: 'c1',
  clientName: 'استودیو نقش',
  channel: 'CARD_TO_CARD',
  note: 'ست آیکون اپلیکیشن',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const TomanReceipt: Story = {
  args: { receipt: receipt({}), onClose: fn(), onEdit: fn(), onDelete: fn() },
}

export const ForeignCurrencyFrozen: Story = {
  args: {
    receipt: receipt({
      currency: 'USDT',
      amountOriginal: 1500,
      rate: 98500,
      amountToman: 147750000,
      clientName: 'بازرگانی آریا',
      channel: 'TETHER',
      note: 'پیش‌پرداخت فاز اول طراحی',
    }),
    onClose: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
}

export const WithoutNote: Story = {
  args: { receipt: receipt({ note: null }), onClose: fn(), onEdit: fn(), onDelete: fn() },
}

const EDIT = /^ویرایش$|^Edit$/
const DELETE = /^حذف$|^Delete$/
const FROZEN = /فریز|Frozen/

export const ShowsTheStoredConversion: Story = {
  ...ForeignCurrencyFrozen,
  play: async ({ canvasElement, step }) => {
    // A Drawer is portalled, so nothing here lives in `canvasElement`.
    const body = within(canvasElement.ownerDocument.body)

    await step('the stored toman value, not a recomputed one', async () => {
      await expect(await body.findByText(/^۱۴۷٬۷۵۰٬۰۰۰ تومان$|^147,750,000 Toman$/)).toBeInTheDocument()
    })

    await step('the original amount and the rate it was captured at', async () => {
      await expect(await body.findByText(/^۱٬۵۰۰٫۰۰ (تتر|Tether)$|^1,500.00 Tether$/)).toBeInTheDocument()
      await expect(await body.findByText(/^۹۸٬۵۰۰$|^98,500$/)).toBeInTheDocument()
    })

    await step('and the permanence is stated, not implied', async () => {
      await expect(await body.findByText(FROZEN)).toBeInTheDocument()
    })
  },
}

export const TomanReceiptHidesTheRateBlock: Story = {
  ...TomanReceipt,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)

    // Wait for the drawer to render before asserting on what is absent.
    await body.findByText(/^۱۸٬۰۰۰٬۰۰۰ تومان$|^18,000,000 Toman$/)

    await expect(body.queryByText(FROZEN)).toBeNull()
    await expect(body.queryByText(/نرخ تبدیل در همان زمان|Exchange rate at the time/)).toBeNull()
    await expect(body.queryByText(/مبلغ اصلی|Original amount/)).toBeNull()
  },
}

export const IsANamedDialogWithOneHeading: Story = {
  ...ForeignCurrencyFrozen,
  play: async ({ canvasElement, step }) => {
    const body = within(canvasElement.ownerDocument.body)

    await step('the dialog carries its own title', async () => {
      await expect(await body.findByRole('dialog', { name: /^جزئیات دریافتی$|^Receipt details$/ })).toBeInTheDocument()
    })

    await step('and the captions inside it are captions, not headings', async () => {
      const headings = await body.findAllByRole('heading')
      await expect(headings).toHaveLength(1)
      await expect(headings[0]).toHaveTextContent(/^جزئیات دریافتی$|^Receipt details$/)
    })
  },
}

export const FooterActionsCarryTheReceipt: Story = {
  ...ForeignCurrencyFrozen,
  play: async ({ args, canvasElement, step }) => {
    const body = within(canvasElement.ownerDocument.body)

    await step('edit', async () => {
      await userEvent.click(await body.findByRole('button', { name: EDIT }))
      await expect(args.onEdit).toHaveBeenCalledWith(args.receipt)
      await expect(args.onDelete).not.toHaveBeenCalled()
    })

    await step('delete', async () => {
      await userEvent.click(await body.findByRole('button', { name: DELETE }))
      await expect(args.onDelete).toHaveBeenCalledWith(args.receipt)
    })

    await step('closing is a separate callback from either of them', async () => {
      await userEvent.click(await body.findByRole('button', { name: /^بستن$|^Close$/ }))
      await expect(args.onClose).toHaveBeenCalledTimes(1)
      await expect(args.onEdit).toHaveBeenCalledTimes(1)
      await expect(args.onDelete).toHaveBeenCalledTimes(1)
    })
  },
}
