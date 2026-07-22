import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { FIXTURE_RECEIPTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { LedgerPage } from './LedgerPage'

const meta = {
  title: 'Pages/Ledger',
  component: LedgerPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/ledger' } },
} satisfies Meta<typeof LedgerPage>

export default meta
type Story = StoryObj<typeof meta>

/** Scenario 2: the toolbar, the totals that track the filter, and the paginated table. */
export const WithData: Story = {}

/** Nothing recorded yet — distinct from a filter that matched nothing. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/ledger' } } }

/**
 * Scenario 2, end to end through the real query.
 *
 * "How much did this one client pay me?" is the question the ledger exists to
 * answer, and the running total tracking the filter is what makes the answer
 * trustworthy. This seeds IndexedDB rather than the query cache: applying a
 * filter changes the query key, so a cache-only story would miss, fall through
 * to an empty database, and pass while proving nothing.
 */
export const FiltersByClientAndRetotals: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const CLIENT = 'Aria Trading'
    const owed = FIXTURE_RECEIPTS.filter((receipt) => receipt.clientName === CLIENT)
    const expected = owed.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await step('open the filter popover', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /فیلترها|Filters/i }))
    })

    await step(`filter to ${CLIENT}`, async () => {
      // The popover renders in a portal, so query the document, not the canvas.
      const body = within(canvasElement.ownerDocument.body)
      await userEvent.type(await body.findByRole('combobox', { name: /مشتری|Client/i }), CLIENT)
      await userEvent.click(await body.findByRole('option', { name: new RegExp(CLIENT, 'i') }))
      await userEvent.click(await body.findByRole('button', { name: /اعمال|Apply/i }))
    })

    await step('the table, the count and the total all follow the filter', async () => {
      const body = within(canvasElement.ownerDocument.body)
      // Every visible row belongs to that client.
      await expect(await body.findAllByText(CLIENT)).toHaveLength(owed.length)
      // And the total is that client's, not the whole ledger's.
      const total = new Intl.NumberFormat('fa-IR').format(expected)
      await expect(await body.findAllByText((content) => content.includes(total))).not.toHaveLength(0)
    })
  },
}

/**
 * Search accepts PERSIAN numerals.
 *
 * A Persian keyboard types «۱۸۰۰۰۰۰۰», the amount is stored as 18000000, and a
 * naive `includes` would find nothing — the user would conclude the receipt was
 * never recorded. The normalisation that prevents that is one call deep and
 * silent when it breaks, so it gets its own assertion.
 */
export const SearchesByPersianNumerals: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const target = FIXTURE_RECEIPTS.find((receipt) => receipt.amountToman === 18_000_000)!

    await step('type the amount in Persian digits', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: /جست|Search receipts/i }), '۱۸۰۰۰۰۰۰')
    })

    await step('the one matching receipt is found', async () => {
      await expect(await canvas.findAllByText(target.clientName!)).toHaveLength(1)
      // And the result count agrees with the table rather than the pre-search set.
      await expect(await canvas.findByText(/^۱ نتیجه$|^1 results?$/)).toBeInTheDocument()
    })
  },
}

// ─── helpers shared by the interaction stories below ──────────────────────────

const fa = new Intl.NumberFormat('fa-IR')
const toman = (value: number) => `${fa.format(value)} تومان`

/** The first `<tbody>` holds the rows; the second holds the total band. */
const dataRows = (canvasElement: HTMLElement): HTMLTableRowElement[] => [
  ...(canvasElement.querySelectorAll('tbody')[0]?.querySelectorAll('tr') ?? []),
]

/** The total band, which is a second `<tbody>` so it cannot scroll away from its rows. */
const totalRow = (canvasElement: HTMLElement): HTMLTableRowElement => {
  const bodies = canvasElement.querySelectorAll('tbody')
  return bodies[bodies.length - 1].querySelectorAll('tr')[0]
}

const rowContaining = (canvasElement: HTMLElement, text: string): HTMLTableRowElement => {
  const found = dataRows(canvasElement).find((row) => (row.textContent ?? '').includes(text))
  if (!found) {
    throw new Error(`no ledger row contains ${text}`)
  }
  return found
}

/**
 * `Field` wraps its control in the `<label>`, so an input's accessible name is
 * its field label — this walks the same association a screen reader would.
 */
const fieldInput = (root: ParentNode, label: RegExp): HTMLInputElement => {
  const node = [...root.querySelectorAll('label')].find((candidate) => label.test(candidate.querySelector('span')?.textContent ?? ''))
  const input = node?.querySelector('input')
  if (!input) {
    throw new Error(`no input under the label matching ${label}`)
  }
  return input
}

const ACTIONS = /^عملیات$|^Actions$/
const TETHER_RECEIPT = FIXTURE_RECEIPTS.find((receipt) => receipt.id === '1')!
const CARD_RECEIPT = FIXTURE_RECEIPTS.find((receipt) => receipt.id === '4')!

const openRowMenu = async (canvasElement: HTMLElement, rowText: string) => {
  const row = rowContaining(canvasElement, rowText)
  await userEvent.click(within(row).getByRole('button', { name: ACTIONS }))
  return within(canvasElement.ownerDocument.body)
}

/**
 * The kebab has to hand the menu the receipt from ITS OWN row. A single shared
 * handler that always passed the first row would look completely correct on
 * screen until someone opened the details of one receipt and read another's
 * numbers — so the drawer is checked against a row picked from the middle of
 * the table, not the top.
 */
export const RowMenuOpensTheRightReceipt: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    const body = await openRowMenu(canvasElement, toman(TETHER_RECEIPT.amountToman))

    await step('view details', async () => {
      await userEvent.click(await body.findByRole('menuitem', { name: /^مشاهده جزئیات$|^View details$/ }))
    })

    await step('the drawer describes that receipt, not another one', async () => {
      await expect(await body.findByText(/^جزئیات دریافتی$|^Receipt details$/)).toBeInTheDocument()
      await expect(await body.findByText(TETHER_RECEIPT.note!)).toBeInTheDocument()
      await expect(await body.findByText(`${fa.format(TETHER_RECEIPT.rate!)}`)).toBeInTheDocument()
      // A toman receipt from a different row must not have leaked in.
      await expect(body.queryByText(CARD_RECEIPT.note!)).toBeNull()
    })
  },
}

/**
 * THE edit case that matters: a foreign-currency receipt.
 *
 * `amountToman` is frozen on write, and the only thing that can reproduce it is
 * the rate stored alongside it. If the edit dialog opened with an empty rate —
 * or with a "current" one — then correcting a typo in the amount would silently
 * revalue a months-old receipt at a rate that has nothing to do with the day the
 * money arrived. Nothing downstream can detect that afterwards.
 *
 * So the dialog is checked for the STORED rate, the amount is edited, and the
 * database is read back directly: 600 × 98,500, with the rate untouched.
 */
export const EditingAForeignReceiptKeepsItsStoredRate: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    const body = await openRowMenu(canvasElement, toman(TETHER_RECEIPT.amountToman))
    await userEvent.click(await body.findByRole('menuitem', { name: /^ویرایش$|^Edit$/ }))

    const dialog = await body.findByRole('dialog')

    await step('every field arrives pre-filled from the record', async () => {
      await expect(within(dialog).getByText(/^ویرایش دریافتی$|^Edit receipt$/)).toBeInTheDocument()
      await expect(fieldInput(dialog, /مبلغ دریافتی|Amount received/)).toHaveValue(fa.format(500).concat('٫۰۰'))
      await expect(fieldInput(dialog, /نرخ تبدیل|exchange rate/i)).toHaveValue(fa.format(TETHER_RECEIPT.rate!))
      await expect(fieldInput(dialog, /مشتری \/ پروژه|Client \/ project/)).toHaveValue(TETHER_RECEIPT.clientName!)
      await expect(fieldInput(dialog, /یادداشت|Note/)).toHaveValue(TETHER_RECEIPT.note!)
      // The preview reproduces the stored value exactly, which is only possible
      // with the stored rate.
      await expect(within(dialog).getByText(toman(TETHER_RECEIPT.amountToman))).toBeInTheDocument()
    })

    await step('correcting the amount revalues at the stored rate, not a new one', async () => {
      const amount = fieldInput(dialog, /مبلغ دریافتی|Amount received/)
      await userEvent.clear(amount)
      await userEvent.type(amount, '600')
      await expect(within(dialog).getByText(toman(600 * TETHER_RECEIPT.rate!))).toBeInTheDocument()
    })

    await step('and that is what is written to the database', async () => {
      await userEvent.click(await within(dialog).findByRole('button', { name: /^ذخیره تغییرات$|^Save changes$/ }))
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())

      const stored = await db.receipts.get(TETHER_RECEIPT.id)
      await expect(stored?.rate).toBe(TETHER_RECEIPT.rate)
      await expect(stored?.currency).toBe('USDT')
      await expect(stored?.amountOriginal).toBe(600)
      await expect(stored?.amountToman).toBe(600 * TETHER_RECEIPT.rate!)
    })
  },
}

/**
 * Delete is two-step, and the first step must be a real escape hatch.
 *
 * There is no server copy of this ledger — a receipt removed by a stray click on
 * a kebab menu is gone for good, and the user would only notice when a total
 * they had already reported no longer reconciles. The cancel path is therefore
 * asserted against the DATABASE, not against the table: a row that merely stays
 * on screen because nothing refetched would prove nothing.
 */
export const CancellingADeleteKeepsTheReceipt: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    await step('cancelling deletes nothing', async () => {
      const body = await openRowMenu(canvasElement, toman(CARD_RECEIPT.amountToman))
      await userEvent.click(await body.findByRole('menuitem', { name: /^حذف$|^Delete$/ }))

      await expect(await body.findByText(/^حذف دریافتی$|^Delete receipt$/)).toBeInTheDocument()
      await userEvent.click(await body.findByRole('button', { name: /^انصراف$|^Cancel$/ }))

      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
      await expect(await db.receipts.get(CARD_RECEIPT.id)).toBeDefined()
      await expect(await db.receipts.count()).toBe(FIXTURE_RECEIPTS.length)
    })

    await step('confirming does', async () => {
      const body = await openRowMenu(canvasElement, toman(CARD_RECEIPT.amountToman))
      await userEvent.click(await body.findByRole('menuitem', { name: /^حذف$|^Delete$/ }))
      await userEvent.click(await body.findByRole('button', { name: /^حذف کن$|^Delete it$/ }))

      await waitFor(async () => expect(await db.receipts.get(CARD_RECEIPT.id)).toBeUndefined())
      // Exactly one row, and it is the one that was chosen.
      await expect(await db.receipts.count()).toBe(FIXTURE_RECEIPTS.length - 1)
    })
  },
}

/**
 * The popover edits a DRAFT. Committing per keystroke would refetch the ledger
 * on every change, and — worse — the half-finished date range would briefly
 * match nothing, so the table would blink empty while the user was still typing.
 *
 * Closing without applying must therefore leave the ledger exactly as it was:
 * no chip, no badge, same total.
 */
export const ClosingTheFilterWithoutApplyingChangesNothing: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    await step('pick a channel in the popover but do not apply it', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^فیلترها|^Filters/ }))
      await userEvent.click(await body.findByRole('combobox', { name: /^کانال$|^Channel$/ }))
      await userEvent.click(await body.findByRole('option', { name: /^تتر$|^Tether$/ }))
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(body.queryByRole('option', { name: /^تتر$|^Tether$/ })).toBeNull())
    })

    await step('the ledger is untouched', async () => {
      await expect(await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)).toBeInTheDocument()
      await expect(canvas.queryByText(/^کانال: تتر$|^Channel: Tether$/)).toBeNull()
      // No badge on the trigger either — the count is the other half of the
      // evidence that a filter is live.
      await expect(await canvas.findByRole('button', { name: /^فیلترها|^Filters/ })).toHaveTextContent(/^فیلترها$|^Filters$/)
    })
  },
}

/**
 * Applying a filter has to produce a chip, and the chip has to be able to undo
 * itself. The popover hides its own state, so without a working chip the only
 * evidence that the total dropped from 458m to 120m is a number the user has to
 * remember.
 */
export const FilterChipRemovesTheFilterAndRestoresTheRows: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const tether = FIXTURE_RECEIPTS.filter((receipt) => receipt.channel === 'TETHER')
    const tetherTotal = tether.reduce((sum, receipt) => sum + receipt.amountToman, 0)
    const wholeLedger = FIXTURE_RECEIPTS.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    await step('apply the Tether channel', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^فیلترها|^Filters/ }))
      await userEvent.click(await body.findByRole('combobox', { name: /^کانال$|^Channel$/ }))
      await userEvent.click(await body.findByRole('option', { name: /^تتر$|^Tether$/ }))
      await userEvent.click(await body.findByRole('button', { name: /^اعمال فیلترها$|^Apply filters$/ }))
    })

    await step('the chip, the rows and the total all agree', async () => {
      await expect(await canvas.findByText(/^کانال: تتر$|^Channel: Tether$/)).toBeInTheDocument()
      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(tether.length))
      await expect(await canvas.findByText(/^جمع کل ۲ دریافتی فیلتر‌شده$|^Total of 2 filtered receipts$/)).toBeInTheDocument()
      await expect(within(totalRow(canvasElement)).getByText(toman(tetherTotal))).toBeInTheDocument()
    })

    await step('removing the chip puts every row back', async () => {
      const chip = (await canvas.findByText(/^کانال: تتر$|^Channel: Tether$/)).closest('.MuiChip-root')
      await userEvent.click(chip!.querySelector('.MuiChip-deleteIcon')!)

      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(FIXTURE_RECEIPTS.length))
      await waitFor(() => expect(within(totalRow(canvasElement)).getByText(toman(wholeLedger))).toBeInTheDocument())
      await expect(canvas.queryByText(/^کانال: تتر$|^Channel: Tether$/)).toBeNull()
    })
  },
}

/**
 * The date range must never invent an end the user cannot see.
 *
 * Both boxes open EMPTY — a popover showing today in both advertises a range
 * that is not applied. And when only one end is chosen, the other is written
 * into the draft AND rendered, because the previous silent fallback built
 * `{from: today, to: <a past date>}` from a single "to" pick: an inverted range
 * that Dexie matches nothing for, with no explanation anywhere on screen.
 */
export const PickingOneEndOfTheRangeFillsTheOtherVisibly: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    await userEvent.click(await canvas.findByRole('button', { name: /^فیلترها|^Filters/ }))
    await body.findByRole('button', { name: /^اعمال فیلترها$|^Apply filters$/ })

    const popover = canvasElement.ownerDocument.querySelector('.MuiPopover-paper')!
    const box = (label: RegExp): HTMLElement => {
      const node = [...popover.querySelectorAll('label')].find((candidate) =>
        label.test(candidate.querySelector('span')?.textContent ?? ''),
      )
      if (!node) {
        throw new Error(`no field labelled ${label}`)
      }
      return node
    }
    // The picker renders ASCII digits behind a Persian-glyph font, so a digit
    // in the text is the test for "this field is showing a date".
    const shown = (element: HTMLElement) => (element.textContent ?? '').replace(/\D/g, '')

    const from = box(/^از تاریخ$|^From date$/)
    const to = box(/^تا تاریخ$|^To date$/)

    await step('both ends start empty', async () => {
      await expect(shown(from)).toBe('')
      await expect(shown(to)).toBe('')
    })

    await step('choose only the closing date', async () => {
      await userEvent.click(within(to).getByRole('button'))
      // Empty leading slots are also `gridcell`s, but they are inert `<div>`s.
      const days = (await body.findAllByRole('gridcell')).filter((day) => day.tagName === 'BUTTON' && !day.hasAttribute('disabled'))
      await userEvent.click(days[0])
      await waitFor(() => expect(body.queryAllByRole('gridcell')).toHaveLength(0))
    })

    await step('the opening date is filled in and shown, not assumed', async () => {
      await waitFor(() => expect(shown(to)).not.toBe(''))
      // Not merely non-empty: the two ends agree, so the range cannot be
      // inverted and cannot silently be "today".
      await expect(shown(from)).toBe(shown(to))
    })
  },
}

/**
 * Sorting is a query-key change, so the reordering happens in Dexie rather than
 * in the table — which means a broken comparator shows up as rows in the wrong
 * order and nothing else. A first click on a new column must sort DESCENDING:
 * "largest receipts first" is the useful default, and the previous behaviour
 * put the five smallest at the top.
 */
export const SortingByAmountReordersTheRows: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const amounts = FIXTURE_RECEIPTS.map((receipt) => receipt.amountToman)
    const largest = Math.max(...amounts)
    const smallest = Math.min(...amounts)

    await canvas.findByText(/^جمع کل ۸ دریافتی$|^Total of 8 receipts$/)

    await step('the first click puts the largest receipt on top', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^معادل تومانی|^Toman equivalent/ }))
      await waitFor(() => expect(dataRows(canvasElement)[0].textContent).toContain(toman(largest)))
    })

    await step('the second click flips it', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^معادل تومانی|^Toman equivalent/ }))
      await waitFor(() => expect(dataRows(canvasElement)[0].textContent).toContain(toman(smallest)))
    })
  },
}
