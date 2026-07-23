import { useLingui } from '@lingui/react/macro'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { ReactNode } from 'react'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import { RowActionsMenu } from 'src/shared/row-actions-menu'
import { Tag } from 'src/shared/tag'
import type { LedgerSort, LedgerSortField, LedgerSummary, ReceiptWithClient } from 'src/shared/types'

export interface LedgerTableProps {
  receipts: ReceiptWithClient[]
  summary: LedgerSummary
  sort: LedgerSort
  /** Drives the total row's wording — "filtered" is a lie when nothing is. */
  filtered?: boolean
  onSortChange: (sort: LedgerSort) => void
  onView: (receipt: ReceiptWithClient) => void
  onEdit: (receipt: ReceiptWithClient) => void
  onDelete: (receipt: ReceiptWithClient) => void
}

type ColumnKey = 'date' | 'client' | 'channel' | 'original' | 'toman' | 'actions'

/**
 * Scenario 2's ledger.
 *
 * The totals row is inside the same `<Table>` rather than a separate card so it
 * cannot scroll out of sync with the rows it sums — the brief requires the
 * total to stay visible and to track the active filter.
 *
 * Columns are dropped on narrow screens, which is what the design does: the
 * phone and tablet frames use this same table component and simply hide cells.
 * It rendered all six at a fixed 900px inside a horizontal scroller instead, so
 * on a 390px phone both money columns sat outside the frame — an income ledger
 * showing everything except the income.
 */
export const LedgerTable = ({ receipts, summary, sort, filtered = false, onSortChange, onView, onEdit, onDelete }: LedgerTableProps) => {
  const { t, i18n } = useLingui()
  const { digits, dateLong } = useFormat()
  const theme = useTheme()

  // Phone frame is 390 and tablet is 834, so the cuts land at MUI's sm and md.
  // Tablet keeps Actions and drops Channel and Original amount; the phone drops
  // Actions too, leaving exactly the three the design shows — date, who paid,
  // and how much in Toman.
  const showActions = useMediaQuery(theme.breakpoints.up('sm'))
  const showSecondary = useMediaQuery(theme.breakpoints.up('md'))

  // Built inside the component so labels follow the active locale. Widths,
  // alignment and sortability all come from `267:984`; everything is
  // start-aligned except the channel tag and the row actions, which centre.
  const allColumns: {
    key: ColumnKey
    field: LedgerSortField | null
    label: string
    align: 'start' | 'center' | 'right'
    width?: number
    visible: boolean
    cell: (receipt: ReceiptWithClient) => ReactNode
  }[] = [
    {
      key: 'date',
      field: 'occurredAt',
      label: t`Date`,
      align: 'start',
      width: 130,
      visible: true,
      cell: (receipt) => dateLong(receipt.occurredAt),
    },
    {
      key: 'client',
      field: 'client',
      label: t`Client / project`,
      align: 'start',
      visible: true,
      cell: (receipt) => receipt.clientName ?? '—',
    },
    {
      key: 'channel',
      field: null,
      label: t`Channel`,
      align: 'center',
      width: 140,
      visible: showSecondary,
      cell: (receipt) => <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />,
    },
    {
      key: 'original',
      field: 'amountOriginal',
      label: t`Original amount`,
      align: 'right',
      width: 160,
      visible: showSecondary,
      cell: (receipt) => <MoneyText value={receipt.amountOriginal} currency={receipt.currency} showUnit />,
    },
    {
      key: 'toman',
      field: 'amountToman',
      label: t`Toman equivalent`,
      align: 'right',
      width: 190,
      visible: true,
      cell: (receipt) => <MoneyText value={receipt.amountToman} sx={{ fontWeight: 600, lineHeight: '24px' }} />,
    },
    {
      key: 'actions',
      field: null,
      label: t`Actions`,
      align: 'center',
      width: 64,
      visible: showActions,
      cell: (receipt) => (
        <RowActionsMenu onView={() => onView(receipt)} onEdit={() => onEdit(receipt)} onDelete={() => onDelete(receipt)} />
      ),
    },
  ]

  const columns = allColumns.filter((column) => column.visible)

  // The total's label spans everything before the Toman figure, and the trailing
  // spacer exists only when Actions does. Hard-coding either produces a row with
  // a different cell count from the header, which widens the whole table.
  const tomanIndex = columns.findIndex((column) => column.key === 'toman')
  const trailingCells = columns.length - tomanIndex - 1

  const toggleSort = (field: LedgerSortField) =>
    onSortChange({
      field,
      direction: sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc',
    })

  return (
    // A region that scrolls must be reachable by keyboard, or the columns past
    // the fold are unreachable without a mouse (axe
    // `scrollable-region-focusable`). `tabIndex` makes it focusable so arrow
    // keys can scroll it, and it needs a name once it is in the tab order.
    <TableContainer tabIndex={0} role="group" aria-label={t`Income ledger table`} sx={{ overflowX: 'auto' }}>
      {/* Only fix the layout once there is enough width to honour the explicit
          widths. On a phone the three columns share whatever the screen gives,
          so there is nothing to scroll. */}
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: showSecondary ? 900 : 0,
          tableLayout: showSecondary ? 'fixed' : 'auto',
          // Three columns of Persian dates and Toman figures still overrun a
          // 390px phone at the desktop inset, so the padding tightens with the
          // screen rather than handing the row back to a scrollbar.
          ...(showActions ? {} : { '& .MuiTableCell-root': { paddingInline: '8px' } }),
        }}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align === 'start' ? undefined : column.align}
                // Widths come from the desktop frame. Pinning them on a phone
                // holds the date column at 130px it does not need and pushes
                // the row wider than the screen.
                sx={{ width: showSecondary ? column.width : undefined }}
              >
                {column.field ? (
                  <TableSortLabel
                    active={sort.field === column.field}
                    direction={sort.field === column.field ? sort.direction : 'desc'}
                    onClick={() => toggleSort(column.field as LedgerSortField)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id} hover>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align === 'start' ? undefined : column.align}
                  sx={{
                    whiteSpace: column.key === 'client' ? undefined : 'nowrap',
                    // The design greys the original amount and keeps the Toman
                    // equivalent in the primary tone — the Toman figure is the
                    // one the row is about.
                    color: column.key === 'original' ? 'text.secondary' : undefined,
                  }}
                >
                  {column.cell(receipt)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        {/* The design's total band (`267:1356`): a `brand-primary-subtle` row
            under a 2px `border-strong` rule, with the figure sitting in the
            Toman column rather than floating at the end of the row. */}
        <TableBody>
          <TableRow
            sx={(theme) => ({
              backgroundColor: theme.palette.brandPrimarySubtle,
              '& td': { borderTop: `2px solid ${theme.palette.borderStrong}`, borderBottom: 'none', paddingBlock: '16px' },
            })}
          >
            <TableCell colSpan={tomanIndex}>
              <Typography variant="subtitle2">
                {filtered
                  ? t`Total of ${digits(summary.receiptCount)} filtered receipts`
                  : t`Total of ${digits(summary.receiptCount)} receipts`}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <MoneyText value={summary.totalToman} variant="subtitle2" sx={{ color: 'brandPrimary' }} />
            </TableCell>
            {trailingCells > 0 ? <TableCell colSpan={trailingCells} /> : null}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
