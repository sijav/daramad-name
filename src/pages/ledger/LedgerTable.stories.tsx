import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { fn } from 'storybook/test'
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

/**
 * Mixed currencies, each showing its original amount beside a frozen toman
 * equivalent. The totals row lives inside the same table so it can never scroll
 * out of sync with the rows it sums.
 */
export const Default: Story = {
  args: {
    receipts: RECEIPTS,
    summary,
    sort: { field: 'occurredAt', direction: 'desc' },
    calendar: 'JALALI',
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

/** Sorted by amount — clicking a column header toggles direction. */
export const SortedByAmount: Story = {
  ...Default,
  args: { ...Default.args, sort: { field: 'amountToman', direction: 'desc' } },
}

/** A filtered view that matched a single receipt; the total tracks the filter. */
export const SingleRow: Story = {
  ...Default,
  args: {
    ...Default.args,
    receipts: [RECEIPTS[1]],
    summary: { totalToman: RECEIPTS[1].amountToman, receiptCount: 1, monthlyAverageToman: RECEIPTS[1].amountToman, monthsInRange: 1 },
  },
}

/** Gregorian rendering, driven by the Settings calendar toggle. */
export const GregorianCalendar: Story = {
  ...Default,
  args: { ...Default.args, calendar: 'GREGORIAN' },
}
