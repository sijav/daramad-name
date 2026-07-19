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
  const columns: { field: LedgerSortField | null; label: string; numeric?: boolean }[] = [
    { field: 'occurredAt', label: t`Date` },
    { field: 'client', label: t`Client` },
    { field: 'channel', label: t`Channel` },
    { field: null, label: t`Original amount`, numeric: true },
    { field: 'amountToman', label: t`Toman equivalent`, numeric: true },
    { field: null, label: t`Actions` },
  ]

  const toggleSort = (field: LedgerSortField) =>
    onSortChange({
      field,
      direction: sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc',
    })

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index} align={column.numeric ? 'left' : 'right'} sx={{ whiteSpace: 'nowrap' }}>
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
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {formatDate(receipt.occurredAt, calendar, persian)}
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{receipt.clientName ?? '—'}</Typography>
                {receipt.note ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {receipt.note}
                  </Typography>
                ) : null}
              </TableCell>

              <TableCell align="right">
                <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
              </TableCell>

              <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                <MoneyText value={receipt.amountOriginal} currency={receipt.currency} showUnit={false} variant="body2" />{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  {i18n._(CURRENCY_LABELS[receipt.currency])}
                </Typography>
              </TableCell>

              <TableCell align="left">
                <MoneyText value={receipt.amountToman} variant="subtitle2" showUnit={false} />
              </TableCell>

              <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                <RowActionsMenu onView={() => onView(receipt)} onEdit={() => onEdit(receipt)} onDelete={() => onDelete(receipt)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableBody>
          <TableRow>
            <TableCell
              colSpan={4}
              align="right"
              sx={(theme) => ({ borderTop: `2px solid ${theme.palette.outlineVariant}`, fontWeight: 600 })}
            >
              {t`Total (${digits(receipts.length)} receipts)`}
            </TableCell>
            <TableCell colSpan={2} align="left" sx={(theme) => ({ borderTop: `2px solid ${theme.palette.outlineVariant}` })}>
              <MoneyText value={summary.totalToman} variant="h3" color="primary.main" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
