import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ReceiptDetailsDrawer } from './ReceiptDetailsDrawer'

const meta = {
  title: 'Shared/ReceiptDetailsDrawer',
  component: ReceiptDetailsDrawer,
  argTypes: {
    receipt: { description: 'The receipt to show; `null` closes the drawer. Selection is what opens it.' },
    onClose: { description: 'Backdrop, Escape and the close button all arrive here.' },
    onEdit: { description: 'Hands the same receipt back, so the caller need not track the selection twice.' },
    onDelete: { description: 'Asks to delete. The confirmation belongs to the page, not the drawer.' },
  },
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

const EDIT = /^ویرایش$|^Edit$/
const DELETE = /^حذف$|^Delete$/
const FROZEN = /فریز|Frozen/

/**
 * The three numbers on this panel are the only place the user can audit a
 * conversion: 1,500 USDT × 98,500 = 147,750,000. If the rate were rendered from
 * anywhere other than the stored `rate`, the arithmetic printed here would stop
 * reconciling and the "frozen" badge would be a false claim.
 */
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

/**
 * A toman receipt was never converted, so there is no rate to show. A "frozen at
 * 0" row here would tell the user their receipt is pinned to an exchange rate
 * that does not exist.
 */
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

/**
 * What the drawer announces when it opens.
 *
 * The paper IS the `role="dialog"`, and it had no accessible name (axe:
 * `aria-dialog-name`) — a screen reader said "dialog" and stopped. It is now
 * pointed at the heading it already draws, so the two cannot drift apart.
 *
 * The heading count is asserted too: MUI maps the `subtitle2` variant onto
 * `<h6>`, so every one of the eight captions used to be published as a level-6
 * heading under the drawer's single `<h3>` — a fake outline, and the level jump
 * axe reports as `heading-order`.
 */
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

/**
 * Both footer buttons hand the receipt back out. Passing the wrong object — or
 * nothing — would open the edit dialog on a different row, or delete one.
 */
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
