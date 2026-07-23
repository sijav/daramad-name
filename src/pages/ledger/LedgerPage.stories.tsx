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

const fa = new Intl.NumberFormat('fa-IR')
const toman = (value: number) => `${fa.format(value)} تومان`

// Both locales, because the Language toolbar decides which one renders.
// `FILTERS` is unanchored at the end: an applied filter appends a count badge.
const SEARCH = /جست|Search receipts/i
const FILTERS = /^فیلترها|^Filters/
const APPLY = /^اعمال فیلترها$|^Apply filters$/
const CHANNEL = /^کانال$|^Channel$/
const TETHER_OPTION = /^تتر$|^Tether$/
const TETHER_CHIP = /^کانال: تتر$|^Channel: Tether$/
const ACTIONS = /^عملیات$|^Actions$/
const ONE_RESULT = /^۱ نتیجه$|^1 results?$/
// 8 is `FIXTURE_RECEIPTS.length`, spelled out because the band prints Persian digits.
const TOTAL_OF_ALL = /^جمع کل ۸ دریافتی$|^Total of 8 receipts$/

const TETHER_RECEIPT = FIXTURE_RECEIPTS.find((receipt) => receipt.id === '1')!
const CARD_RECEIPT = FIXTURE_RECEIPTS.find((receipt) => receipt.id === '4')!

// The table renders two `<tbody>`s: the rows, then the total band.
const dataRows = (canvasElement: HTMLElement): HTMLTableRowElement[] => [
  ...(canvasElement.querySelectorAll('tbody')[0]?.querySelectorAll('tr') ?? []),
]

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

// `Field` wraps its control in the `<label>` and puts its own text in the first
// `<span>`. Matching that span keeps the helper line, which is also a span, out
// of the comparison.
const fieldLabel = (root: ParentNode, label: RegExp): HTMLElement => {
  const node = [...root.querySelectorAll('label')].find((candidate) => label.test(candidate.querySelector('span')?.textContent ?? ''))
  if (!node) {
    throw new Error(`no field labelled ${label}`)
  }
  return node
}

const fieldInput = (root: ParentNode, label: RegExp): HTMLInputElement => {
  const input = fieldLabel(root, label).querySelector('input')
  if (!input) {
    throw new Error(`no input under the label matching ${label}`)
  }
  return input
}

const openRowMenu = async (canvasElement: HTMLElement, rowText: string) => {
  const row = rowContaining(canvasElement, rowText)
  await userEvent.click(within(row).getByRole('button', { name: ACTIONS }))
  return within(canvasElement.ownerDocument.body)
}

export const WithData: Story = {}

export const Empty: Story = { parameters: { page: { data: 'empty', route: '/ledger' } } }

export const FiltersByClientAndRetotals: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The popover renders in a portal, so query the document, not the canvas.
    const body = within(canvasElement.ownerDocument.body)
    const CLIENT = 'Aria Trading'
    const theirs = FIXTURE_RECEIPTS.filter((receipt) => receipt.clientName === CLIENT)
    const theirTotal = theirs.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await step('open the filter popover', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))
    })

    await step(`filter to ${CLIENT}`, async () => {
      await userEvent.type(await body.findByRole('combobox', { name: /مشتری|Client/i }), CLIENT)
      await userEvent.click(await body.findByRole('option', { name: new RegExp(CLIENT, 'i') }))
      await userEvent.click(await body.findByRole('button', { name: APPLY }))
    })

    await step('the table, the count and the total all follow the filter', async () => {
      await expect(await body.findAllByText(CLIENT)).toHaveLength(theirs.length)
      await expect(await body.findAllByText((content) => content.includes(fa.format(theirTotal)))).not.toHaveLength(0)
    })
  },
}

export const SearchesByPersianNumerals: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const target = FIXTURE_RECEIPTS.find((receipt) => receipt.amountToman === 18_000_000)!

    await step('type the amount in Persian digits', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: SEARCH }), '۱۸۰۰۰۰۰۰')
    })

    await step('the one matching receipt is found', async () => {
      await expect(await canvas.findAllByText(target.clientName!)).toHaveLength(1)
      // The count follows the table, not the pre-search set.
      await expect(await canvas.findByText(ONE_RESULT)).toBeInTheDocument()
    })
  },
}

export const SearchNarrowsTheTotalsNotJustTheTable: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const target = FIXTURE_RECEIPTS.find((receipt) => receipt.amountToman === 18_000_000)!
    const wholeLedger = FIXTURE_RECEIPTS.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(FIXTURE_RECEIPTS.length))

    await step('search down to a single receipt', async () => {
      await userEvent.type(await canvas.findByRole('textbox', { name: SEARCH }), String(target.amountToman))
      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(1))
    })

    await step('the total band sums that receipt alone', async () => {
      await expect(within(totalRow(canvasElement)).getByText(toman(target.amountToman))).toBeInTheDocument()
    })

    await step('and the whole-ledger total is gone from the cards too', async () => {
      await expect(await canvas.findByText(ONE_RESULT)).toBeInTheDocument()
      // The regression: the Total card and the total band both kept printing
      // the whole-ledger figure beside a heading that said one result.
      await expect(canvas.queryAllByText(toman(wholeLedger))).toHaveLength(0)
    })
  },
}

export const LoadFailureOffersARetryThatRecovers: Story = {
  // `data: null`, not an omitted key: parameters deep-merge, so leaving it out
  // keeps the meta's `data: 'full'` and the page renders from the seeded cache
  // without ever issuing the query that has to fail.
  parameters: { page: { data: null, route: '/ledger' } },
  beforeEach: async () => {
    const clear = await seedDatabase()
    db.close({ disableAutoOpen: true })
    return async () => {
      if (!db.isOpen()) {
        await db.open()
      }
      await clear()
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the ledger says the read failed, without suggesting the data is gone', async () => {
      await expect(await canvas.findByText(/^دفتر درآمد بارگذاری نشد$|^The ledger could not be loaded$/)).toBeInTheDocument()
      await expect(canvas.queryByRole('table')).toBeNull()
    })

    await step('retrying re-issues the query rather than only clearing the message', async () => {
      await db.open()
      await userEvent.click(await canvas.findByRole('button', { name: /^دوباره امتحان کن$|^Try again$/ }))

      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(FIXTURE_RECEIPTS.length))
    })
  },
}

export const RowMenuOpensTheRightReceipt: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(TOTAL_OF_ALL)

    const body = await openRowMenu(canvasElement, toman(TETHER_RECEIPT.amountToman))

    await step('view details', async () => {
      await userEvent.click(await body.findByRole('menuitem', { name: /^مشاهده جزئیات$|^View details$/ }))
    })

    await step('the drawer describes that receipt, not another one', async () => {
      await expect(await body.findByText(/^جزئیات دریافتی$|^Receipt details$/)).toBeInTheDocument()
      await expect(await body.findByText(TETHER_RECEIPT.note!)).toBeInTheDocument()
      await expect(await body.findByText(fa.format(TETHER_RECEIPT.rate!))).toBeInTheDocument()
      // A Toman receipt from a different row must not have leaked in.
      await expect(body.queryByText(CARD_RECEIPT.note!)).toBeNull()
    })
  },
}

export const EditingAForeignReceiptKeepsItsStoredRate: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(TOTAL_OF_ALL)

    const body = await openRowMenu(canvasElement, toman(TETHER_RECEIPT.amountToman))
    await userEvent.click(await body.findByRole('menuitem', { name: /^ویرایش$|^Edit$/ }))

    const dialog = await body.findByRole('dialog')

    await step('every field arrives pre-filled from the record', async () => {
      await expect(within(dialog).getByText(/^ویرایش دریافتی$|^Edit receipt$/)).toBeInTheDocument()
      await expect(fieldInput(dialog, /مبلغ دریافتی|Amount received/)).toHaveValue(`${fa.format(500)}٫۰۰`)
      await expect(fieldInput(dialog, /نرخ تبدیل|exchange rate/i)).toHaveValue(fa.format(TETHER_RECEIPT.rate!))
      await expect(fieldInput(dialog, /مشتری \/ پروژه|Client \/ project/)).toHaveValue(TETHER_RECEIPT.clientName!)
      await expect(fieldInput(dialog, /یادداشت|Note/)).toHaveValue(TETHER_RECEIPT.note!)
      // Reproducing the stored total exactly is only possible with the stored rate.
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

export const CancellingADeleteKeepsTheReceipt: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(TOTAL_OF_ALL)

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
      // One row gone, not the table.
      await expect(await db.receipts.count()).toBe(FIXTURE_RECEIPTS.length - 1)
    })
  },
}

export const ClosingTheFilterWithoutApplyingChangesNothing: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText(TOTAL_OF_ALL)

    await step('pick a channel in the popover but do not apply it', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))
      await userEvent.click(await body.findByRole('combobox', { name: CHANNEL }))
      await userEvent.click(await body.findByRole('option', { name: TETHER_OPTION }))
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(body.queryByRole('option', { name: TETHER_OPTION })).toBeNull())
    })

    await step('the ledger is untouched', async () => {
      await expect(await canvas.findByText(TOTAL_OF_ALL)).toBeInTheDocument()
      await expect(canvas.queryByText(TETHER_CHIP)).toBeNull()
      // Anchored both ends: a bare label means no count badge, the other half of
      // the evidence that no filter is live.
      await expect(await canvas.findByRole('button', { name: FILTERS })).toHaveTextContent(/^فیلترها$|^Filters$/)
    })
  },
}

export const FilterChipRemovesTheFilterAndRestoresTheRows: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const tether = FIXTURE_RECEIPTS.filter((receipt) => receipt.channel === 'TETHER')
    const tetherTotal = tether.reduce((sum, receipt) => sum + receipt.amountToman, 0)
    const wholeLedger = FIXTURE_RECEIPTS.reduce((sum, receipt) => sum + receipt.amountToman, 0)

    await canvas.findByText(TOTAL_OF_ALL)

    await step('apply the Tether channel', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))
      await userEvent.click(await body.findByRole('combobox', { name: CHANNEL }))
      await userEvent.click(await body.findByRole('option', { name: TETHER_OPTION }))
      await userEvent.click(await body.findByRole('button', { name: APPLY }))
    })

    await step('the chip, the rows and the total all agree', async () => {
      await expect(await canvas.findByText(TETHER_CHIP)).toBeInTheDocument()
      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(tether.length))
      await expect(await canvas.findByText(/^جمع کل ۲ دریافتی فیلتر‌شده$|^Total of 2 filtered receipts$/)).toBeInTheDocument()
      await expect(within(totalRow(canvasElement)).getByText(toman(tetherTotal))).toBeInTheDocument()
    })

    await step('removing the chip puts every row back', async () => {
      const chip = (await canvas.findByText(TETHER_CHIP)).closest('.MuiChip-root')
      await userEvent.click(chip!.querySelector('.MuiChip-deleteIcon')!)

      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(FIXTURE_RECEIPTS.length))
      await waitFor(() => expect(within(totalRow(canvasElement)).getByText(toman(wholeLedger))).toBeInTheDocument())
      await expect(canvas.queryByText(TETHER_CHIP)).toBeNull()
    })

    // The popover stays mounted for the life of the page, so its draft outlives
    // the close and once held the channel this chip deleted. Reopening and
    // pressing Apply used to put the removed filter straight back.
    await step('and the popover has forgotten it too, so Apply cannot put it back', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))

      const channel = await body.findByRole('combobox', { name: CHANNEL })
      await expect(channel).not.toHaveTextContent(TETHER_OPTION)

      await userEvent.click(await body.findByRole('button', { name: APPLY }))
      await waitFor(() => expect(dataRows(canvasElement)).toHaveLength(FIXTURE_RECEIPTS.length))
      await expect(canvas.queryByText(TETHER_CHIP)).toBeNull()
    })
  },
}

export const PickingOneEndOfTheRangeFillsTheOtherVisibly: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText(TOTAL_OF_ALL)

    await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))
    await body.findByRole('button', { name: APPLY })

    const popover = canvasElement.ownerDocument.querySelector('.MuiPopover-paper')!
    const from = fieldLabel(popover, /^از تاریخ$|^From date$/)
    const to = fieldLabel(popover, /^تا تاریخ$|^To date$/)
    // The picker renders ASCII digits behind a Persian-glyph font, so a digit in
    // the text is the test for "this field is showing a date".
    const shown = (element: HTMLElement) => (element.textContent ?? '').replace(/\D/g, '')

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
      // Equal, not merely non-empty: the fallback neither inverted the range nor
      // reached for today.
      await expect(shown(from)).toBe(shown(to))
    })
  },
}

export const SortingByAmountReordersTheRows: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const amounts = FIXTURE_RECEIPTS.map((receipt) => receipt.amountToman)
    const largest = Math.max(...amounts)
    const smallest = Math.min(...amounts)

    await canvas.findByText(TOTAL_OF_ALL)

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
