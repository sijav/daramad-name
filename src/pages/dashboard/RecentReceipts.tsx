import { useLingui } from '@lingui/react/macro'
import { Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import { Tag } from 'src/shared/tag'
import type { CalendarSystem, ReceiptWithClient } from 'src/shared/types'
import { formatDate } from 'src/shared/utils'

export interface RecentReceiptsProps {
  receipts: ReceiptWithClient[]
  calendar: CalendarSystem
}

/**
 * The dashboard's "latest receipts" list.
 *
 * Deliberately not the full `LedgerTable`: no sorting, no actions, no
 * pagination. It exists to confirm "yes, the thing I just recorded is in
 * there", and reusing the ledger table would drag its whole toolbar with it.
 */
export const RecentReceipts = ({ receipts, calendar }: RecentReceiptsProps) => {
  const { t, i18n } = useLingui()
  const { persian } = useFormat()

  if (receipts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        {t`Nothing recorded in this range yet.`}
      </Typography>
    )
  }

  return (
    // Scrolls inside its own card. Without this the table's intrinsic width
    // (~432px with a date, client, tag and amount) pushes the whole document
    // wider than a 375px phone, which drags the fixed app bar and bottom nav
    // out of alignment with the content.
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 260 }}>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell sx={{ whiteSpace: 'nowrap', width: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(receipt.occurredAt, calendar, persian)}
                </Typography>
              </TableCell>

              {/* `maxWidth: 0` lets the cell shrink below its content so the
                  note can ellipsize instead of widening the row. */}
              <TableCell sx={{ maxWidth: 0 }}>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {receipt.clientName ?? '—'}
                  </Typography>
                  {receipt.note ? (
                    <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {receipt.note}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>

              {/* The channel is the least useful column at a glance, and
                  dropping it below `sm` is what lets a row fit a phone without
                  a sideways swipe. It is still shown on the ledger. */}
              <TableCell sx={{ width: 1, display: { xs: 'none', sm: 'table-cell' } }}>
                <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
              </TableCell>

              <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: 1 }}>
                <MoneyText value={receipt.amountToman} variant="subtitle2" showUnit={false} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
