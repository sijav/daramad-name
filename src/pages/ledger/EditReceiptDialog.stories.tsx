import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { EditReceiptDialog } from './EditReceiptDialog'

// Editing is the one place a stored value can be silently rewritten.
//
// `amountToman` is frozen at record time and never recomputed on read — that is
// the product's central promise. So an edit must revalue at the receipt's OWN
// stored rate, not at whatever the rate is today. Getting that wrong would not
// fail loudly; it would quietly restate history, and the certificate built from
// it carries the new number to an embassy.

const TETHER = FIXTURE_RECEIPTS.find((receipt) => receipt.id === '1')!
const TOMAN = FIXTURE_RECEIPTS.find((receipt) => receipt.currency === 'TOMAN')!

const meta = {
  title: 'Pages/Ledger/EditReceiptDialog',
  component: EditReceiptDialog,
  parameters: { layout: 'fullscreen', page: { route: '/ledger' } },
  beforeEach: async () => await seedDatabase(),
} satisfies Meta<typeof EditReceiptDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The field's own `<label>` wraps its control, so the label names the input. */
const fieldInput = (root: ParentNode, label: RegExp): HTMLInputElement => {
  const node = [...root.querySelectorAll('label')].find((candidate) => label.test(candidate.querySelector('span')?.textContent ?? ''))
  const input = node?.querySelector('input')
  if (!input) {
    throw new Error(`no input under the label matching ${label}`)
  }
  return input
}

export const ForeignCurrency: Story = {
  args: { receipt: TETHER, onClose: fn() },
}

export const TomanReceipt: Story = {
  args: { receipt: TOMAN, onClose: fn() },
}

export const OpensPreFilled: Story = {
  args: { receipt: TETHER, onClose: fn() },
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog')

    await expect(fieldInput(dialog, /نرخ تبدیل|exchange rate/i)).toHaveValue(new Intl.NumberFormat('fa-IR').format(TETHER.rate!))
    await expect(fieldInput(dialog, /مشتری \/ پروژه|Client \/ project/)).toHaveValue(TETHER.clientName!)
  },
}

export const CancellingWritesNothing: Story = {
  args: { receipt: TETHER, onClose: fn() },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog')

    const amount = fieldInput(dialog, /مبلغ دریافتی|Amount received/)
    await userEvent.clear(amount)
    await userEvent.type(amount, '999')

    await userEvent.click(await within(dialog).findByRole('button', { name: /^بستن$|^Close$/ }))

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())
    await expect((await db.receipts.get(TETHER.id))?.amountToman).toBe(TETHER.amountToman)
  },
}

export const SavingKeepsTheStoredRate: Story = {
  args: { receipt: TETHER, onClose: fn() },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog')

    const amount = fieldInput(dialog, /مبلغ دریافتی|Amount received/)
    await userEvent.clear(amount)
    await userEvent.type(amount, '600')

    await userEvent.click(await within(dialog).findByRole('button', { name: /^ذخیره تغییرات$|^Save changes$/ }))

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())

    const stored = await db.receipts.get(TETHER.id)
    await expect(stored?.rate).toBe(TETHER.rate)
    await expect(stored?.amountToman).toBe(600 * TETHER.rate!)
  },
}
