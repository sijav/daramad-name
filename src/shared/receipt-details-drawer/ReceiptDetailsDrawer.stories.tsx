import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReceiptWithClient } from 'src/shared/types'
import { fn } from 'storybook/test'
import { ReceiptDetailsDrawer } from './ReceiptDetailsDrawer'

const meta = {
  title: 'Shared/ReceiptDetailsDrawer',
  component: ReceiptDetailsDrawer,
  parameters: { layout: 'fullscreen' },
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

/** A toman receipt has no conversion, so no rate block and no frozen badge. */
export const TomanReceipt: Story = {
  args: { receipt: receipt({}), onClose: fn(), onEdit: fn(), onDelete: fn() },
}

/**
 * The drawer is where the freeze rule becomes visible: the original amount, the
 * rate it was captured at, and a badge saying it will not move. Without this a
 * Tether receipt whose toman value never changes looks like a bug.
 */
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

/** A receipt with no note must not leave an empty labelled block. */
export const WithoutNote: Story = {
  args: { receipt: receipt({ note: null }), onClose: fn(), onEdit: fn(), onDelete: fn() },
}
