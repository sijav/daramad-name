import { useLingui } from '@lingui/react/macro'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from '@mui/material'
import { CHANNEL_LABELS, CURRENCY_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import { RowActionsMenu } from 'src/shared/row-actions-menu'
import { Tag } from 'src/shared/tag'
import type { CalendarSystem, LedgerSort, LedgerSortField, LedgerSummary, ReceiptWithClient } from 'src/shared/types'
import { formatDate } from 'src/shared/utils'

export interface LedgerTableProps {
  receipts: ReceiptWithClient[]
  summary: LedgerSummary
  sort: LedgerSort
  calendar: CalendarSystem
  onSortChange: (sort: LedgerSort) => void
  onView: (receipt: ReceiptWithClient) => void
  onEdit: (receipt: ReceiptWithClient) => void
  onDelete: (receipt: ReceiptWithClient) => void
}

/**
 * Scenario 2's ledger.
 *
 * The totals row is inside the same `<Table>` rather than a separate card so it
 * cannot scroll out of sync with the rows it sums — the brief requires the
 * total to stay visible and to track the active filter.
 */
export const LedgerTable = ({ receipts, summary, sort, calendar, onSortChange, onView, onEdit, onDelete }: LedgerTableProps) => {
  const { t, i18n } = useLingui()
  // `calendar` stays a prop so the component remains presentational and a
  // story can demo either calendar; only the digit style follows the locale.
  const { digits, persian } = useFormat()

  // Built inside the component so the labels follow the active locale.
  // Widths are explicit because English headers are wider than Persian and were
  // squeezing the client column into a two-line wrap.
  // Widths, alignment and sortability all come from `267:984`. Everything is
  // start-aligned except the channel tag and the row actions, which centre.
  const columns: { field: LedgerSortField | null; label: string; align: 'start' | 'center'; width?: number | string }[] = [
    { field: 'occurredAt', label: t`Date`, align: 'start', width: 130 },
    { field: 'client', label: t`Client`, align: 'start' },
    { field: null, label: t`Channel`, align: 'center', width: 140 },
    { field: 'amountOriginal', label: t`Original amount`, align: 'start', width: 160 },
    { field: 'amountToman', label: t`Toman equivalent`, align: 'start', width: 190 },
    { field: null, label: t`Actions`, align: 'center', width: 64 },
  ]

  const toggleSort = (field: LedgerSortField) =>
    onSortChange({
      field,
      direction: sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc',
    })

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
        <TableHead>
          {/* `surface-subtle` band, secondary labels, and the active column in
              brand blue with a full-opacity chevron. */}
          <TableRow
            sx={(theme) => ({
              '& th': {
                backgroundColor: theme.palette.surfaceSubtle,
                borderBottom: `1px solid ${theme.palette.borderDefault}`,
                color: theme.palette.text.secondary,
                ...theme.typography.subtitle2,
                whiteSpace: 'nowrap',
                paddingBlock: '11px',
              },
            })}
          >
            {columns.map((column, index) => (
              <TableCell key={index} align={column.align === 'center' ? 'center' : undefined} sx={{ width: column.width }}>
                {column.field ? (
                  <TableSortLabel
                    active={sort.field === column.field}
                    direction={sort.field === column.field ? sort.direction : 'desc'}
                    onClick={() => toggleSort(column.field as LedgerSortField)}
                    sx={(theme) => ({
                      gap: 0.5,
                      '&.Mui-active': { color: theme.palette.brandPrimary },
                      '&.Mui-active .MuiTableSortLabel-icon': { color: theme.palette.brandPrimary, opacity: 1 },
                      '& .MuiTableSortLabel-icon': { fontSize: 16, opacity: 0.5, margin: 0 },
                    })}
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
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(receipt.occurredAt, calendar, persian)}</TableCell>

              <TableCell>
                <Typography variant="body2">{receipt.clientName ?? '—'}</Typography>
                {receipt.note ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {receipt.note}
                  </Typography>
                ) : null}
              </TableCell>

              <TableCell align="center">
                <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
              </TableCell>

              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <MoneyText value={receipt.amountOriginal} currency={receipt.currency} showUnit={false} variant="body2" />{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  {i18n._(CURRENCY_LABELS[receipt.currency])}
                </Typography>
              </TableCell>

              <TableCell>
                <MoneyText value={receipt.amountToman} variant="subtitle2" showUnit={false} />
              </TableCell>

              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                <RowActionsMenu onView={() => onView(receipt)} onEdit={() => onEdit(receipt)} onDelete={() => onDelete(receipt)} />
              </TableCell>
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
            <TableCell colSpan={4}>
              <Typography variant="subtitle2">{t`Total of ${digits(receipts.length)} filtered receipts`}</Typography>
            </TableCell>
            <TableCell>
              <MoneyText value={summary.totalToman} variant="subtitle2" sx={{ color: 'brandPrimary' }} />
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
