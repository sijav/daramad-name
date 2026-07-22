import { useLingui } from '@lingui/react/macro'
import { Chip, Divider, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from 'src/shared/insight-callout'
import { MoneyText } from 'src/shared/money-text'
import { clientsQueryKey, getClientsQuery, getLedgerQuery, getLedgerQueryKey } from 'src/shared/queries'
import { SurfaceCard } from 'src/shared/surface-card'
import { Tag } from 'src/shared/tag'
import { dayRange, formatDate } from 'src/shared/utils'

/**
 * The design's Quick Entry support column: today at a glance, the receipt just
 * recorded, and the clients most likely to be picked next.
 *
 * It exists to answer "did that save?" without leaving the form — which is the
 * whole point of a 15-second entry flow. Every panel reads from queries the
 * ledger already populates, so recording a receipt refreshes all three.
 */
export interface QuickEntryAsideProps {
  /**
   * Fills the form's client field. Without it the "recent clients" chips are
   * inert — an outlined chip in a form column reads as tappable, so a user taps
   * one, nothing happens, and they type the name by hand. That is also how a
   * second «Aria Trading » gets created and splits a client's totals.
   */
  onPickClient?: (name: string) => void
}

export const QuickEntryAside = ({ onPickClient }: QuickEntryAsideProps) => {
  const { t, i18n } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const { persian, number, amount } = useFormat()

  const today = dayRange(new Date())

  const { data: todayLedger } = useQuery({
    queryKey: getLedgerQueryKey({ range: today }, { field: 'occurredAt', direction: 'desc' }, calendar),
    queryFn: getLedgerQuery,
  })

  const { data: latest } = useQuery({
    queryKey: getLedgerQueryKey({}, { field: 'occurredAt', direction: 'desc' }, calendar),
    queryFn: getLedgerQuery,
  })

  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })

  const lastReceipt = latest?.receipts[0]

  return (
    <Stack spacing={3}>
      <SurfaceCard radius="lg">
        <Stack spacing={2}>
          <Typography variant="h3">{t`Today so far`}</Typography>

          <Stack spacing={0.25}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t`Received today`}
            </Typography>
            <MoneyText value={todayLedger?.summary.totalToman ?? 0} variant="h1" />
          </Stack>

          {/* `176:813`: a hairline between the two figures, so the second does
              not read as a caption of the first. */}
          <Divider />

          <Stack spacing={0.25}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t`Receipts today`}
            </Typography>
            <Typography variant="h3">{t`${number(todayLedger?.receipts.length ?? 0)} receipts`}</Typography>
          </Stack>
        </Stack>
      </SurfaceCard>

      {lastReceipt ? (
        <SurfaceCard radius="lg">
          <Stack spacing={1.5}>
            <Typography variant="h3">{t`Last receipt`}</Typography>

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {lastReceipt.clientName ?? '—'}
              </Typography>
              <Tag label={i18n._(CHANNEL_LABELS[lastReceipt.channel])} />
            </Stack>

            <MoneyText
              value={lastReceipt.amountOriginal}
              currency={lastReceipt.currency}
              showUnit
              sx={{ fontWeight: 600, lineHeight: '24px' }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t`Equivalent to ${amount(lastReceipt.amountToman, 'TOMAN')} Toman`}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatDate(lastReceipt.occurredAt, calendar, persian)}
            </Typography>

            <Typography
              variant="caption"
              component="button"
              onClick={() => navigate('/ledger')}
              sx={{ alignSelf: 'flex-start', background: 'none', border: 0, p: 0, color: 'brandPrimary', cursor: 'pointer' }}
            >
              {t`View in the ledger`}
            </Typography>
          </Stack>
        </SurfaceCard>
      ) : null}

      {clients.length > 0 ? (
        <SurfaceCard radius="lg">
          <Stack spacing={2}>
            <Typography variant="h3">{t`Recent clients`}</Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {clients.slice(0, 6).map((client) => (
                <Chip
                  key={client.id}
                  label={client.name}
                  variant="outlined"
                  onClick={onPickClient ? () => onPickClient(client.name) : undefined}
                />
              ))}
            </Stack>
          </Stack>
        </SurfaceCard>
      ) : null}

      <InsightCallout
        tone="info"
        message={t`The rate and Toman equivalent are stored at the moment you record a receipt. Later rate changes do not affect it.`}
      />
    </Stack>
  )
}
