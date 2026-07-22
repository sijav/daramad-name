import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ReceiptForm } from './ReceiptForm'
import { useReceiptForm } from './useReceiptForm'

const meta = {
  title: 'Shared/ReceiptForm',
  component: ReceiptForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReceiptForm>

export default meta
type Story = StoryObj<typeof meta>

interface HarnessProps {
  initial?: ReceiptWithClient
  /** Called only when the form actually passed validation. */
  onSaved?: () => void
  pending?: boolean
  /** Editing an existing receipt drops «ذخیره و بعدی». */
  withNext?: boolean
}

/**
 * Story copy goes through the catalog like the app's does, so switching the
 * Language toolbar to Persian does not leave an English button in an otherwise
 * Persian form.
 *
 * The submit gate is QuickEntryPage's, line for line: mark the form submitted,
 * refuse to go on if it is invalid, then reset — fully for a finished entry,
 * keeping the client for the next one in a batch. Reproducing it here is what
 * lets a story assert that an invalid form does not save.
 */
const Harness = ({ initial, onSaved, pending, withNext = true }: HarnessProps) => {
  const { t } = useLingui()
  const form = useReceiptForm(initial)

  const submit = (keepClient: boolean) => {
    form.markSubmitted()
    if (!form.isValid) {
      return
    }
    onSaved?.()
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
        // Spies rather than bare arrows, so both submit paths show up in the
        // Actions panel and a play function can assert which one ran.
        onSubmit={fn(() => submit(false))}
        onSubmitAndNext={withNext ? fn(() => submit(true)) : undefined}
      />
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

// `Field` renders its label as a detached `<label>`, so the amount and rate
// boxes have no accessible name to query by — they are taken in DOM order, the
// rate appearing between the amount and the note only while a foreign currency
// is selected.
const boxes = (canvasElement: HTMLElement) => within(canvasElement).findAllByRole<HTMLInputElement>('textbox')
const amountBox = async (canvasElement: HTMLElement) => (await boxes(canvasElement))[0]
const rateBox = async (canvasElement: HTMLElement) => (await boxes(canvasElement))[1]

const AMOUNT_ERROR = /مبلغ را وارد کن|Enter an amount greater than zero/
const RATE_ERROR = /نرخ تبدیل لازمه|needs an exchange rate/
const SUBMIT = /^ثبت دریافتی$|^Record a receipt$/
const SAVE_AND_NEXT = /^ذخیره و بعدی$|^Save and next$/

/** The 15-second path: today's date, toman, card-to-card, amount autofocused. */
export const Empty: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
}

/** A non-toman currency reveals the rate field and the live toman equivalent. */
export const ForeignCurrency: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => (
    <Harness onSaved={args.onSubmit} initial={receipt({ currency: 'USDT', amountOriginal: 500, rate: 98500, amountToman: 49250000 })} />
  ),
}

/**
 * The backdating case. With a past date the rate field relabels to "the rate on
 * that date" and warns, because the toman value freezes permanently — entering
 * today's rate against a two-month-old receipt would be silently wrong forever.
 */
export const Backdated: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    return (
      <Harness
        onSaved={args.onSubmit}
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

/** Saving is in flight: both buttons go dead so one receipt cannot be logged twice. */
export const Pending: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} pending initial={receipt({})} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: SUBMIT })).toBeDisabled()
    await expect(await canvas.findByRole('button', { name: SAVE_AND_NEXT })).toBeDisabled()
  },
}

/**
 * The edit dialog. «ذخیره و بعدی» is for logging a batch; offering it while
 * editing an existing receipt would promise a "next" that does not exist.
 */
export const Editing: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} withNext={false} initial={receipt({})} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('button', { name: SUBMIT })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: SAVE_AND_NEXT })).not.toBeInTheDocument()
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
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('type the amount', async () => {
      // Every query is async: the form mounts behind providers, so a synchronous
      // `getBy` runs against an empty canvas.
      await canvas.findByText(/مبلغ دریافتی|Amount received/i)
      await userEvent.type(await amountBox(canvasElement), '500')
    })

    await step('switch the currency to Tether', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^تتر$|^Tether$/ }))
    })

    await step('enter the rate for that day', async () => {
      await canvas.findByText(/نرخ تبدیل|exchange rate/i)
      await userEvent.type(await rateBox(canvasElement), '98500')
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

/**
 * Errors wait for a submit attempt. An empty form is invalid from the first
 * frame, and shouting about it before the user has typed anything makes the one
 * screen that has to be fast feel hostile.
 */
export const StaysQuietUntilYouTryToSave: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByText(/مبلغ دریافتی|Amount received/i)
    await expect(canvas.queryByText(AMOUNT_ERROR)).not.toBeInTheDocument()
  },
}

/**
 * An empty amount must not save. A receipt of nothing is not a receipt, and one
 * that got through would sit in the ledger contributing zero to a total the
 * user believes is complete.
 */
export const BlocksSavingWithoutAnAmount: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(await canvas.findByText(AMOUNT_ERROR)).toBeInTheDocument()
    await expect(args.onSubmit).not.toHaveBeenCalled()

    // And it saves once the amount is there — the block is the amount, not the
    // click.
    await userEvent.type(await amountBox(canvasElement), '2500000')
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
    await waitFor(async () => expect(canvas.queryByText(AMOUNT_ERROR)).not.toBeInTheDocument())
  },
}

/**
 * The one that matters most. A foreign-currency receipt with no rate stores a
 * toman value of zero, and that value is FROZEN — it is never recomputed, so
 * nothing later can repair it. The receipt then sits in the ledger looking
 * complete and contributing nothing to the total on the certificate.
 */
export const BlocksForeignCurrencyWithoutARate: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(await amountBox(canvasElement), '500')
    await userEvent.click(await canvas.findByRole('button', { name: /^تتر$|^Tether$/ }))
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(await canvas.findByText(RATE_ERROR)).toBeInTheDocument()
    // Marked invalid for assistive tech too, not only tinted red.
    await expect(await rateBox(canvasElement)).toHaveAttribute('aria-invalid', 'true')
    await expect(args.onSubmit).not.toHaveBeenCalled()
    // The preview says so too: no rate, no toman.
    await expect(await canvas.findByText(/^۰ تومان$|^0 Toman$/)).toBeInTheDocument()

    await userEvent.type(await rateBox(canvasElement), '98500')
    await userEvent.click(await canvas.findByRole('button', { name: SUBMIT }))

    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
  },
}

/**
 * Going back to toman throws the rate away. Keeping it would let a rate typed
 * for one currency be silently reused for another — 98,500 entered for Tether
 * and then applied to dollars is a receipt three times its real size, frozen.
 */
export const ReturningToTomanClearsTheRate: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => (
    <Harness onSaved={args.onSubmit} initial={receipt({ currency: 'USDT', amountOriginal: 500, rate: 98500, amountToman: 49250000 })} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await rateBox(canvasElement)).toHaveValue('۹۸٬۵۰۰')

    await userEvent.click(await canvas.findByRole('button', { name: /^تومان$|^Toman$/ }))
    // The rate field goes away with the currency that needed it.
    await waitFor(async () => expect(canvas.queryByText(/نرخ تبدیل|exchange rate/i)).not.toBeInTheDocument())

    await userEvent.click(await canvas.findByRole('button', { name: /^دلار$|^USD$/ }))

    await expect(await canvas.findByText(/نرخ تبدیل|exchange rate/i)).toBeInTheDocument()
    await expect(await rateBox(canvasElement)).toHaveValue('')
  },
}

/**
 * «ذخیره و بعدی» exists so a freelancer can log a morning's receipts in one
 * pass: the amount and the note clear, the client and the channel stay. Losing
 * the client on every save is what makes people stop after the second one.
 */
export const SaveAndNextKeepsTheClientAndChannel: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(await amountBox(canvasElement), '2500000')
    await userEvent.type(await canvas.findByRole('combobox'), 'Aria Trading')
    await userEvent.click(await canvas.findByRole('radio', { name: /^حواله$|^Wire transfer$/ }))

    await userEvent.click(await canvas.findByRole('button', { name: SAVE_AND_NEXT }))
    await expect(args.onSubmit).toHaveBeenCalledTimes(1)

    // Cleared for the next receipt…
    await waitFor(async () => expect(await amountBox(canvasElement)).toHaveValue(''))
    // …but the client and the channel are still set.
    await expect(await canvas.findByRole('combobox')).toHaveValue('Aria Trading')
    await expect(await canvas.findByRole('radio', { name: /^حواله$|^Wire transfer$/ })).toHaveAttribute('aria-checked', 'true')
  },
}

/**
 * The rest of the form actually records what is typed into it, and a plain save
 * clears ALL of it — including the client, because a finished entry is not the
 * start of a batch.
 */
export const RecordsTheClientChannelAndNote: Story = {
  args: { form: {} as never, submitLabel: '', onSubmit: fn() },
  render: (args) => <Harness onSaved={args.onSubmit} />,
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
    await expect(args.onSubmit).toHaveBeenCalledTimes(1)

    await waitFor(async () => expect(await canvas.findByRole('combobox')).toHaveValue(''))
    await expect(note).toHaveValue('')
  },
}
