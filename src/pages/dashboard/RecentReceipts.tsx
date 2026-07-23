import { useLingui } from '@lingui/react/macro'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { radius } from 'src/core/theme'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import { Tag } from 'src/shared/tag'
import type { ReceiptWithClient } from 'src/shared/types'

export interface RecentReceiptsProps {
  receipts: ReceiptWithClient[]
}

/**
 * The dashboard's "latest receipts" list (`154:638`).
 *
 * Deliberately not the full `LedgerTable`: no sorting, no actions, no
 * pagination. It exists to confirm "yes, the thing I just recorded is in
 * there", and reusing the ledger table would drag its whole toolbar with it.
 *
 * The Toman figure is the one column that matters at a glance, so the design
 * gives it 20/600 while everything else sits at 14 — this is a summary, not a
 * grid to scan.
 */
export const RecentReceipts = ({ receipts }: RecentReceiptsProps) => {
  const { t, i18n } = useLingui()
  const { date } = useFormat()

  if (receipts.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
        {t`Nothing recorded in this range yet.`}
      </Typography>
    )
  }

  return (
    // The design's own bordered, 16px-rounded frame — it is a table INSIDE the
    // card, not the card's own edge.
    // Scrollable, so it must be keyboard reachable — otherwise the columns past
    // the fold cannot be reached without a mouse (axe
    // `scrollable-region-focusable`). Named, because it is now in the tab order.
    <TableContainer
      tabIndex={0}
      role="group"
      aria-label={t`Latest receipts table`}
      sx={(theme) => ({
        overflowX: 'auto',
        border: `1px solid ${theme.palette.borderDefault}`,
        borderRadius: `${radius.lg}px`,
      })}
    >
      <Table sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow
            sx={(theme) => ({
              '& th': {
                backgroundColor: theme.palette.surfaceContainerHigh,
                borderBottom: 'none',
                color: theme.palette.text.secondary,
                paddingBlock: '15px',
              },
            })}
          >
            <TableCell sx={{ width: 120 }}>{t`Date`}</TableCell>
            <TableCell>{t`Client / project`}</TableCell>
            <TableCell sx={{ width: 140 }}>{t`Channel`}</TableCell>
            <TableCell align="right" sx={{ width: 150 }}>{t`Original amount`}</TableCell>
            <TableCell align="right" sx={{ width: 200 }}>{t`Toman equivalent`}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id} sx={{ '& td': { paddingBlock: '17px' } }}>
              <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{date(receipt.occurredAt)}</TableCell>

              <TableCell sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {receipt.clientName ?? '—'}
                </Typography>
              </TableCell>

              <TableCell>
                <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
              </TableCell>

              <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                <MoneyText value={receipt.amountOriginal} currency={receipt.currency} showUnit />
              </TableCell>

              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {/* `50:32`: the headline figure of the row. */}
                <MoneyText value={receipt.amountToman} showUnit={false} sx={{ fontSize: 20, fontWeight: 600, lineHeight: '28px' }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
