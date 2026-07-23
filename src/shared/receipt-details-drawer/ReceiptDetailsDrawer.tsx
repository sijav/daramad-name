import { Trans, useLingui } from '@lingui/react/macro'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { useId, type ReactNode } from 'react'
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
 * Where the frozen conversion is explained. The ledger shows only the toman
 * figure; the original amount, the captured rate and the «frozen» marker are
 * here, so a Tether receipt whose value never moves reads as a guarantee rather
 * than a bug.
 *
 * `anchor="right"` is written once; the RTL plugin mirrors it in Persian.
 */
export const ReceiptDetailsDrawer = ({ receipt, onClose, onEdit, onDelete }: ReceiptDetailsDrawerProps) => {
  const { t, i18n } = useLingui()
  const { amount, dateLong, number } = useFormat()
  const titleId = useId()

  return (
    <Drawer
      anchor="right"
      open={receipt !== null}
      onClose={onClose}
      // The paper IS the `role="dialog"`, so the name goes there or it opens
      // unnamed (axe `aria-dialog-name`). Pointing at the heading rather than
      // repeating it in an `aria-label` keeps the two from drifting apart.
      slotProps={{ paper: { 'aria-labelledby': titleId, sx: { width: { xs: '100%', sm: 420 } } } }}
    >
      {receipt ? (
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
            <Typography id={titleId} variant="h3">
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
                <MoneyText sx={{ color: 'primary.main' }} value={receipt.amountToman} variant="h2" />
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
                  <Typography sx={{ color: 'text.secondary' }} variant="caption">
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

// `component="span"` is load-bearing: MUI maps `subtitle2` onto `<h6>`, so
// these captions published eight level-6 headings under the drawer's `<h3>`,
// a level jump axe reports as `heading-order`. `display: block` keeps the
// layout the heading element was providing.
const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box>
    <Typography variant="subtitle2" component="span" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
      {label}
    </Typography>
    {children}
  </Box>
)
