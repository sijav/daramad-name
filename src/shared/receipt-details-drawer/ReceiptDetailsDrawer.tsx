import { Trans, useLingui } from '@lingui/react/macro'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { CHANNEL_LABELS, CURRENCY_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import { Tag } from 'src/shared/tag'
import type { ReceiptWithClient } from 'src/shared/types'

export interface ReceiptDetailsDrawerProps {
  receipt: ReceiptWithClient | null
  onClose: () => void
  onEdit: (receipt: ReceiptWithClient) => void
  onDelete: (receipt: ReceiptWithClient) => void
}

/**
 * Read-only detail view for one receipt.
 *
 * This is where the frozen conversion is actually explained to the user: the
 * ledger shows the toman figure, but only here do they see the original amount,
 * the rate it was captured at, and a «frozen» marker saying it will not move.
 * Without that, a Tether receipt whose toman value never changes looks like a
 * bug rather than the guarantee it is.
 *
 * `anchor="right"` is written once; the RTL plugin mirrors it in Persian.
 */
export const ReceiptDetailsDrawer = ({ receipt, onClose, onEdit, onDelete }: ReceiptDetailsDrawerProps) => {
  const { t, i18n } = useLingui()
  const { amount, dateLong, number } = useFormat()

  return (
    <Drawer anchor="right" open={receipt !== null} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 } } } }}>
      {receipt ? (
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
            <Typography variant="h3">
              <Trans>Receipt details</Trans>
            </Typography>
            <IconButton onClick={onClose} aria-label={t`Close`}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Divider />

          <Stack spacing={2.5} sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
            <Detail label={t`Toman equivalent`}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <MoneyText value={receipt.amountToman} variant="h2" color="primary.main" />
                {receipt.rate !== null ? <Tag tone="primary" icon={<LockRoundedIcon sx={{ fontSize: 14 }} />} label={t`Frozen`} /> : null}
              </Stack>
            </Detail>

            {receipt.rate !== null ? (
              <>
                <Detail label={t`Original amount`}>
                  <Typography variant="body1">
                    {amount(receipt.amountOriginal, receipt.currency)} {i18n._(CURRENCY_LABELS[receipt.currency])}
                  </Typography>
                </Detail>

                <Detail label={t`Exchange rate at the time`}>
                  <Typography variant="body1">{number(receipt.rate)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    <Trans>Captured when the receipt was recorded. Later rate changes do not affect this amount.</Trans>
                  </Typography>
                </Detail>
              </>
            ) : null}

            <Detail label={t`Date received`}>
              <Typography variant="body1">{dateLong(receipt.occurredAt)}</Typography>
            </Detail>

            <Detail label={t`Client / project`}>
              <Typography variant="body1">{receipt.clientName ?? '—'}</Typography>
            </Detail>

            <Detail label={t`Payment channel`}>
              <Tag label={i18n._(CHANNEL_LABELS[receipt.channel])} />
            </Detail>

            {receipt.note ? (
              <Detail label={t`Note`}>
                <Typography variant="body2">{receipt.note}</Typography>
              </Detail>
            ) : null}
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1.5} sx={{ p: 2.5 }}>
            <Button variant="contained" onClick={() => onEdit(receipt)} sx={{ flex: 1 }}>
              <Trans>Edit</Trans>
            </Button>
            <Button variant="outlined" color="error" onClick={() => onDelete(receipt)}>
              <Trans>Delete</Trans>
            </Button>
          </Stack>
        </Stack>
      ) : null}
    </Drawer>
  )
}

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
      {label}
    </Typography>
    {children}
  </Box>
)
