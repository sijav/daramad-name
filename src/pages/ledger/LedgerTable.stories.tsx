import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { expect, fn, userEvent, within } from 'storybook/test'
import { LedgerTable } from './LedgerTable'

const meta = {
  title: 'Pages/Ledger/LedgerTable',
  component: LedgerTable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LedgerTable>

export default meta
type Story = StoryObj<typeof meta>

const row = (
  id: string,
  monthsAgo: number,
  clientName: string,
  channel: ReceiptWithClient['channel'],
  currency: ReceiptWithClient['currency'],
  amountOriginal: number,
  rate: number | null,
  note: string | null,
): ReceiptWithClient => {
  const occurred = new Date()
  occurred.setMonth(occurred.getMonth() - monthsAgo)
  return {
    id,
    occurredAt: occurred.toISOString(),
    amountOriginal,
    currency,
    rate,
    amountToman: rate ? Math.round(amountOriginal * rate) : amountOriginal,
    clientId: clientName,
    clientName,
    channel,
    note,
    createdAt: occurred.toISOString(),
    updatedAt: occurred.toISOString(),
  }
}

const RECEIPTS = [
  row('1', 0, 'Naghsh Studio', 'CARD_TO_CARD', 'TOMAN', 18000000, null, 'App icon set'),
  row('2', 0, 'Aria Trading', 'TETHER', 'USDT', 500, 98500, 'Deposit for design phase one'),
  row('3', 1, 'Homa Cafe', 'CARD_TO_CARD', 'TOMAN', 9500000, null, 'Menu design'),
  row('4', 1, 'Aria Trading', 'REMITTANCE', 'USD', 1200, 96200, 'Phase two settlement'),
  row('5', 2, 'Dadepardaz Co.', 'OTHER', 'TOMAN', 22000000, null, null),
]

const summary = {
  totalToman: RECEIPTS.reduce((sum, r) => sum + r.amountToman, 0),
  receiptCount: RECEIPTS.length,
  monthlyAverageToman: Math.round(RECEIPTS.reduce((sum, r) => sum + r.amountToman, 0) / 3),
  monthsInRange: 3,
}

export const Default: Story = {
  args: {
    receipts: RECEIPTS,
    summary,
    sort: { field: 'occurredAt', direction: 'desc' },
    onSortChange: fn(),
    onView: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
  render: (args) => (
    <SurfaceCard>
      <LedgerTable {...args} />
    </SurfaceCard>
  ),
}

export const SortedByAmount: Story = {
  ...Default,
  args: { ...Default.args, sort: { field: 'amountToman', direction: 'desc' } },
}

export const SingleRow: Story = {
  ...Default,
  args: {
    ...Default.args,
    receipts: [RECEIPTS[1]],
    summary: { totalToman: RECEIPTS[1].amountToman, receiptCount: 1, monthlyAverageToman: RECEIPTS[1].amountToman, monthsInRange: 1 },
  },
}

// There is no Gregorian variant here on purpose. Dates come from `useFormat`,
// which reads the calendar out of Settings, the table takes no calendar of its
// own, so a story could only have pinned a prop nothing reads and shown Jalali
// dates under a Gregorian label. The two calendars are covered where the choice
// actually lands: `formatDateLong` in dates.test.ts, and the Settings toggle in
// SettingsPage.DisplayPreferencesPersist.

const fa = new Intl.NumberFormat('fa-IR')
const dataRows = (canvasElement: HTMLElement): HTMLTableRowElement[] => [
  ...(canvasElement.querySelectorAll('tbody')[0]?.querySelectorAll('tr') ?? []),
]
const totalRow = (canvasElement: HTMLElement): HTMLTableRowElement => {
  const bodies = canvasElement.querySelectorAll('tbody')
  return bodies[bodies.length - 1].querySelectorAll('tr')[0]
}

export const TotalDescribesTheSummaryNotTheVisibleRows: Story = {
  ...Default,
  args: {
    ...Default.args,
    receipts: RECEIPTS.slice(0, 2),
    filtered: true,
    summary: { totalToman: 640_000_000, receiptCount: 25, monthlyAverageToman: 91_428_571, monthsInRange: 7 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/۲۵ دریافتی فیلتر|25 filtered receipts/)).toBeInTheDocument()
    // The sum of the two visible rows is 67,250,000, the row must not print it.
    await expect(await canvas.findByText(`${fa.format(640_000_000)} تومان`)).toBeInTheDocument()
    await expect(canvas.queryByText(`${fa.format(67_250_000)} تومان`)).toBeNull()
    await expect(dataRows(canvasElement)).toHaveLength(2)
  },
}

export const UnfilteredTotalDoesNotClaimToBeFiltered: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^جمع کل ۵ دریافتی$|^Total of 5 receipts$/)).toBeInTheDocument()
    await expect(canvas.queryByText(/فیلتر‌شده|filtered receipts/)).toBeNull()
  },
}

export const HeaderClicksToggleSortCorrectly: Story = {
  ...Default,
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the column already sorted descending flips to ascending', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^تاریخ|^Date/ }))
      await expect(args.onSortChange).toHaveBeenLastCalledWith({ field: 'occurredAt', direction: 'asc' })
    })

    await step('a different column starts descending rather than inheriting the direction', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^معادل تومانی|^Toman equivalent/ }))
      await expect(args.onSortChange).toHaveBeenLastCalledWith({ field: 'amountToman', direction: 'desc' })
    })

    await step('the channel column is not sortable, so it has no button', async () => {
      await expect(canvas.queryByRole('button', { name: /^کانال$|^Channel$/ })).toBeNull()
    })
  },
}

export const TotalRowSpansMatchTheHeaderOnAPhone: Story = {
  ...Default,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/^جمع کل ۵ دریافتی$|^Total of 5 receipts$/)

    const headerCells = [...canvasElement.querySelectorAll('thead th')]
    // Channel, Original amount and Actions are all dropped below `sm`.
    await expect(headerCells).toHaveLength(3)

    for (const row of dataRows(canvasElement)) {
      await expect(row.querySelectorAll('td')).toHaveLength(headerCells.length)
    }

    const spans = [...totalRow(canvasElement).querySelectorAll('td')].reduce((sum, cell) => sum + cell.colSpan, 0)
    await expect(spans).toBe(headerCells.length)
  },
}
