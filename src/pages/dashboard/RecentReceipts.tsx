import { useLingui } from '@lingui/react/macro'
import { Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material'
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
    <Table size="small">
      <TableBody>
        {receipts.map((receipt) => (
          <TableRow key={receipt.id}>
            <TableCell sx={{ whiteSpace: 'nowrap', width: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDate(receipt.occurredAt, calendar, persian)}
              </Typography>
            </TableCell>

            <TableCell>
              <Stack spacing={0.25}>
                <Typography variant="body2">{receipt.clientName ?? '—'}</Typography>
                {receipt.note ? (
                  <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {receipt.note}
                  </Typography>
                ) : null}
              </Stack>
            </TableCell>

            <TableCell sx={{ width: 1 }}>
              <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
            </TableCell>

            <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: 1 }}>
              <MoneyText value={receipt.amountToman} variant="subtitle2" showUnit={false} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
