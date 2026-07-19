import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { ReceiptForm } from './ReceiptForm'
import { useReceiptForm } from './useReceiptForm'

const meta = {
  title: 'Shared/ReceiptForm',
  component: ReceiptForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReceiptForm>

export default meta
type Story = StoryObj<typeof meta>

const Harness = ({ initial }: { initial?: ReceiptWithClient }) => {
  const form = useReceiptForm(initial)
  return (
    <GlassCard sx={{ maxWidth: 560 }}>
      <ReceiptForm form={form} submitLabel="ثبت دریافتی" onSubmit={() => {}} onSubmitAndNext={() => {}} />
    </GlassCard>
  )
}

const receipt = (overrides: Partial<ReceiptWithClient>): ReceiptWithClient => ({
  id: 'story',
  occurredAt: new Date().toISOString(),
  amountOriginal: 2500000,
  currency: 'TOMAN',
  rate: null,
  amountToman: 2500000,
  clientId: null,
  clientName: 'بازرگانی آریا',
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

/** The 15-second path: today's date, toman, card-to-card, amount autofocused. */
export const Empty: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: () => {} },
  render: () => <Harness />,
}

/** A non-toman currency reveals the rate field and the live toman equivalent. */
export const ForeignCurrency: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: () => {} },
  render: () => <Harness initial={receipt({ currency: 'USDT', amountOriginal: 500, rate: 98500, amountToman: 49250000 })} />,
}

/**
 * The backdating case. With a past date the rate field relabels to «نرخ تبدیل در
 * همان تاریخ» and warns, because the toman value freezes permanently — entering
 * today's rate against a two-month-old receipt would be silently wrong forever.
 */
export const Backdated: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: () => {} },
  render: () => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    return (
      <Harness
        initial={receipt({
          currency: 'USDT',
          amountOriginal: 750,
          rate: 94800,
          amountToman: 71100000,
          occurredAt: twoMonthsAgo.toISOString(),
        })}
      />
    )
  },
}
