import { useLingui } from '@lingui/react/macro'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { CHANNEL_LABELS, CURRENCY_LABELS } from 'src/shared/constants'
import { MoneyText } from 'src/shared/money-text'
import type { CalendarSystem, LedgerSort, LedgerSortField, LedgerSummary, ReceiptWithClient } from 'src/shared/types'
import { formatDate, toPersianDigits } from 'src/shared/utils'

export interface LedgerTableProps {
  receipts: ReceiptWithClient[]
  summary: LedgerSummary
  sort: LedgerSort
  calendar: CalendarSystem
  onSortChange: (sort: LedgerSort) => void
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
export const LedgerTable = ({ receipts, summary, sort, calendar, onSortChange, onEdit, onDelete }: LedgerTableProps) => {
  const { t, i18n } = useLingui()

  // Built inside the component so the labels follow the active locale.
  const columns: { field: LedgerSortField | null; label: string; numeric?: boolean }[] = [
    { field: 'occurredAt', label: t`تاریخ` },
    { field: 'client', label: t`مشتری` },
    { field: 'channel', label: t`کانال` },
    { field: null, label: t`مبلغ اصلی`, numeric: true },
    { field: 'amountToman', label: t`معادل تومانی`, numeric: true },
    { field: null, label: '' },
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
                {formatDate(receipt.occurredAt, calendar)}
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">{receipt.clientName ?? '—'}</Typography>
                {receipt.note ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {receipt.note}
                  </Typography>
                ) : null}
              </TableCell>

              <TableCell align="right">{i18n._(CHANNEL_LABELS[receipt.channel])}</TableCell>

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
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => onEdit(receipt)} aria-label={t`ویرایش`}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(receipt)} aria-label={t`حذف`}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
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
              {t`جمع کل (${toPersianDigits(receipts.length)} دریافتی)`}
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
