import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ReceiptForm, type ReceiptFormProps } from './ReceiptForm'
import { useReceiptForm } from './useReceiptForm'

interface HarnessProps extends ReceiptFormProps {
  initial?: ReceiptWithClient
  /** Fires only once the form passed validation, `onSubmit` fires on the press. */
  onSaved: () => void
  /** Editing an existing receipt drops «ذخیره و بعدی». */
  withNext?: boolean
}

/**
 * Repeats QuickEntryPage's submit gate without the mutation, so a story can assert that an invalid form does not save. `t` keeps the
 * submit label following the Language toolbar.
 */
const Harness = ({ initial, onSubmit, onSubmitAndNext, onSaved, pending, withNext = true }: HarnessProps) => {
  const { t } = useLingui()
  const form = useReceiptForm(initial)

  const submit = (keepClient: boolean) => {
    form.markSubmitted()
    if (!form.isValid) {
      return
    }
    onSaved()
    if (keepClient) {
      form.resetKeepingClient()
    } else {
      form.reset()
    }
  }

  return (
    <SurfaceCard sx={{ maxWidth: 560 }}>
      <ReceiptForm
        form={form}
        submitLabel={t`Record a receipt`}
        pending={pending}
        // `onSubmit` records every press, `onSaved` only the presses that got past validation.
        onSubmit={() => {
          onSubmit()
          submit(false)
        }}
        onSubmitAndNext={
          withNext
            ? () => {
                onSubmitAndNext?.()
                submit(true)
              }
            : undefined
        }
      />
    </SurfaceCard>
  )
}

const meta = {
  title: 'Shared/ReceiptForm',
  component: ReceiptForm,
  parameters: {
    layout: 'padded',
  },
  render: (args) => <Harness {...args} />,
  // The harness builds `form` and `submitLabel` itself, so no control can drive them.
  argTypes: {
    form: { control: false, table: { disable: true } },
    submitLabel: { control: false, table: { disable: true } },
    initial: { control: false },
    pending: { control: 'boolean' },
    withNext: { control: 'boolean' },
  },
  args: {
    pending: false,
    withNext: true,
    onSubmit: fn(),
    onSubmitAndNext: fn(),
    onSaved: fn(),
  },
} satisfies Meta<HarnessProps>

export default meta
type Story = StoryObj<HarnessProps>

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

const AMOUNT_LABEL = /مبلغ دریافتی|Amount received/i
const RATE_LABEL = /نرخ تبدیل|exchange rate/i
const AMOUNT_ERROR = /مبلغ را وارد کن|Enter an amount greater than zero/
const RATE_ERROR = /نرخ تبدیل لازمه|needs an exchange rate/
const SUBMIT = /^ثبت دریافتی$|^Record a receipt$/
const SAVE_AND_NEXT = /^ذخیره و بعدی$|^Save and next$/

// `Field` wraps its control in the `<label>`, so each input is named by its label text.
//
// Every query is async: the form mounts behind providers, so a synchronous `getBy` runs against an empty canvas.
const amountBox = (canvasElement: HTMLElement) => within(canvasElement).findByLabelText<HTMLInputElement>(AMOUNT_LABEL)
const rateBox = (canvasElement: HTMLElement) => within(canvasElement).findByLabelText<HTMLInputElement>(RATE_LABEL)

const twoMonthsAgo = (): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - 2)
  return date.toISOString()
}

export const Empty: Story = {}

export const ForeignCurrency: Story = {
  args: { initial: receipt({ currency: 'USDT', amountOriginal: 500, rate: 98500, amountToman: 49250000 }) },
}

export const Backdated: Story = {
  args: {
    initial: receipt({ currency: 'USDT', amountOriginal: 750, rate: 94800, amountToman: 71100000, occurredAt: twoMonthsAgo() }),
  },
}

export const Pending: Story = {
  args: { pending: true, initial: receipt({}) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: SUBMIT })).toBeDisabled()
    await expect(await canvas.findByRole('button', { name: SAVE_AND_NEXT })).toBeDisabled()
  },
}

export const Editing: Story = {
  args: { withNext: false, initial: receipt({}) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: SUBMIT })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: SAVE_AND_NEXT })).not.toBeInTheDocument()
  },
}

export const RecordsAForeignReceipt: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('type the amount', async () => {
      await userEvent.type(await amountBox(canvasElement), '500')
    })

    await step('switch the currency to Tether', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^تتر$|^Tether$/ }))
    })

    await step('enter the rate for that day', async () => {
      await userEvent.type(await rateBox(canvasElement), '98500')
    })

    await step('the toman equivalent is computed and frozen', async () => {
      // 500 x 98,500 = 49,250,000.
      await expect(await canvas.findByText(/۴۹٬۲۵۰٬۰۰۰|49,250,000/)).toBeInTheDocument()
      await expect(await canvas.findByText(/فریز|Frozen/i)).toBeInTheDocument()
    })
  },
}

export const WarnsWhenBackdated: Story = {
  ...Backdated,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The label asks for the rate on THAT date, not today's.
    await expect(await canvas.findByText(/در همان تاریخ|on that date/i)).toBeInTheDocument()
    // The alert states that the toman value is frozen permanently.
    await expect(await canvas.findByRole('alert')).toBeInTheDocument()
  },
}

export const StaysQuietUntilYouTryToSave: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByText(AMOUNT_LABEL)
    await expect(canvas.queryByText(AMOUNT_ERROR)).not.toBeInTheDocument()
  },
}

export const BlocksSavingWithoutAnAmount: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(await canvas.findByText(AMOUNT_ERROR)).toBeInTheDocument()
    // The press landed, what stopped is the save. A button that ignored the click would look broken instead.
    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
    await expect(args.onSaved).not.toHaveBeenCalled()

    await userEvent.type(await amountBox(canvasElement), '2500000')
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(args.onSaved).toHaveBeenCalledTimes(1)
    await waitFor(async () => expect(canvas.queryByText(AMOUNT_ERROR)).not.toBeInTheDocument())
  },
}

export const BlocksForeignCurrencyWithoutARate: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(await amountBox(canvasElement), '500')
    await userEvent.click(await canvas.findByRole('button', { name: /^تتر$|^Tether$/ }))
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(await canvas.findByText(RATE_ERROR)).toBeInTheDocument()
    // Marked invalid for assistive tech too, not only tinted red.
    await expect(await rateBox(canvasElement)).toHaveAttribute('aria-invalid', 'true')
    await expect(args.onSaved).not.toHaveBeenCalled()
    // No rate, no toman in the preview.
    await expect(await canvas.findByText(/^۰ تومان$|^0 Toman$/)).toBeInTheDocument()

    await userEvent.type(await rateBox(canvasElement), '98500')
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(args.onSaved).toHaveBeenCalledTimes(1)
  },
}

export const ReturningToTomanClearsTheRate: Story = {
  args: { initial: receipt({ currency: 'USDT', amountOriginal: 500, rate: 98500, amountToman: 49250000 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await rateBox(canvasElement)).toHaveValue('۹۸٬۵۰۰')

    await userEvent.click(await canvas.findByRole('button', { name: /^تومان$|^Toman$/ }))
    await waitFor(async () => expect(canvas.queryByText(RATE_LABEL)).not.toBeInTheDocument())

    await userEvent.click(await canvas.findByRole('button', { name: /^دلار$|^USD$/ }))

    await expect(await canvas.findByText(RATE_LABEL)).toBeInTheDocument()
    await expect(await rateBox(canvasElement)).toHaveValue('')
  },
}

export const SaveAndNextKeepsTheClientAndChannel: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(await amountBox(canvasElement), '2500000')
    await userEvent.type(await canvas.findByRole('combobox'), 'Aria Trading')
    await userEvent.click(await canvas.findByRole('radio', { name: /^حواله$|^Wire transfer$/ }))

    await userEvent.click(await canvas.findByRole('button', { name: SAVE_AND_NEXT }))
    await expect(args.onSubmitAndNext).toHaveBeenCalledTimes(1)
    await expect(args.onSaved).toHaveBeenCalledTimes(1)

    await waitFor(async () => expect(await amountBox(canvasElement)).toHaveValue(''))
    await expect(await canvas.findByRole('combobox')).toHaveValue('Aria Trading')
    await expect(await canvas.findByRole('radio', { name: /^حواله$|^Wire transfer$/ })).toHaveAttribute('aria-checked', 'true')
    // `resetKeepingClient` clears the submit flag along with the values, so the emptied amount does not come back red.
    await expect(canvas.queryByText(AMOUNT_ERROR)).not.toBeInTheDocument()
  },
}

export const RecordsTheClientChannelAndNote: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const note = await canvas.findByPlaceholderText(/مثلاً|e\.g\./)

    await userEvent.type(await amountBox(canvasElement), '2500000')
    await userEvent.type(await canvas.findByRole('combobox'), 'Aria Trading')
    await userEvent.type(note, 'phase one')
    await userEvent.click(await canvas.findByRole('radio', { name: /^دیگر$|^Other$/ }))

    await expect(await canvas.findByRole('radio', { name: /^دیگر$|^Other$/ })).toHaveAttribute('aria-checked', 'true')
    await expect(note).toHaveValue('phase one')

    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))
    await expect(args.onSaved).toHaveBeenCalledTimes(1)

    await waitFor(async () => expect(await canvas.findByRole('combobox')).toHaveValue(''))
    await expect(note).toHaveValue('')
  },
}
