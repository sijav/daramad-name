import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, userEvent, within } from 'storybook/test'
import { ReceiptForm } from './ReceiptForm'
import { useReceiptForm } from './useReceiptForm'

const meta = {
  title: 'Shared/ReceiptForm',
  component: ReceiptForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReceiptForm>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Story copy goes through the catalog like the app's does, so switching the
 * Language toolbar to Persian does not leave an English button in an otherwise
 * Persian form.
 */
const Harness = ({ initial }: { initial?: ReceiptWithClient }) => {
  const { t } = useLingui()
  const form = useReceiptForm(initial)
  return (
    <SurfaceCard sx={{ maxWidth: 560 }}>
      <ReceiptForm form={form} submitLabel={t`Record a receipt`} onSubmit={() => {}} onSubmitAndNext={() => {}} />
    </SurfaceCard>
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
  clientName: 'Aria Trading',
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
 * The backdating case. With a past date the rate field relabels to "the rate on
 * that date" and warns, because the toman value freezes permanently — entering
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

/**
 * Scenario 1, driven rather than read from a fixture: type an amount, pick
 * Tether, type the day's rate, and the Toman equivalent appears immediately and
 * is marked frozen.
 *
 * This is the number the whole tool exists to be right about — it is stored on
 * write and never recomputed, so a wrong one here is wrong permanently.
 */
export const RecordsAForeignReceipt: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: () => {} },
  render: () => <Harness />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    // Every query is async: the form mounts behind providers, so a synchronous
    // `getBy` runs against an empty canvas.
    const inputs = async () => [...canvasElement.querySelectorAll('input')]

    await step('type the amount', async () => {
      await canvas.findByText(/مبلغ دریافتی|Amount received/i)
      // The amount box is the one the form autofocuses.
      const amount = (await inputs()).find((input) => input === canvasElement.ownerDocument.activeElement) ?? (await inputs())[1]
      await userEvent.type(amount, '500')
    })

    await step('switch the currency to Tether', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /تتر|Tether|USDT/i }))
    })

    await step('enter the rate for that day', async () => {
      await canvas.findByText(/نرخ تبدیل|exchange rate/i)
      const rate = (await inputs()).find((input) => input.value === '')
      await userEvent.type(rate!, '98500')
    })

    await step('the toman equivalent is computed and frozen', async () => {
      // 500 x 98,500 = 49,250,000, rendered in Persian numerals.
      await expect(await canvas.findByText(/۴۹٬۲۵۰٬۰۰۰|49,250,000/)).toBeInTheDocument()
      await expect(await canvas.findByText(/فریز|Frozen/i)).toBeInTheDocument()
    })
  },
}

/**
 * Scenario 5. A past date must change what the rate field ASKS FOR: entering
 * today's rate against a two-month-old receipt freezes a wrong number forever,
 * and nothing downstream can detect it.
 */
export const WarnsWhenBackdated: Story = {
  ...Backdated,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The label asks for the rate on THAT date, not today's.
    await expect(await canvas.findByText(/در همان تاریخ|on that date/i)).toBeInTheDocument()
    // And the permanence is stated rather than implied.
    await expect(await canvas.findByRole('alert')).toBeInTheDocument()
  },
}
