import { useLingui } from '@lingui/react/macro'
import { Button, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { DateField } from 'src/shared/date-field'
import { clientsQueryKey, getClientsQuery } from 'src/shared/queries'
import { CHANNELS, type Channel, type LedgerFilter } from 'src/shared/types'

export interface LedgerFiltersProps {
  filter: LedgerFilter
  onFilterChange: (filter: LedgerFilter) => void
}

/** Date range, client and channel — the three filters scenario 2 needs. */
export const LedgerFilters = ({ filter, onFilterChange }: LedgerFiltersProps) => {
  const { t, i18n } = useLingui()
  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })
  const hasFilters = Boolean(filter.range || filter.clientId || filter.channel)

  const patchRange = (key: 'from' | 'to', iso: string) => {
    const now = new Date().toISOString()
    const range = filter.range ?? { from: now, to: now }
    onFilterChange({ ...filter, range: { ...range, [key]: iso } })
  }

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5, alignItems: { md: 'center' } }}>
      <DateField
        label={t`From date`}
        value={filter.range?.from ?? new Date().toISOString()}
        onValueChange={(iso) => patchRange('from', iso)}
        disableFuture={false}
      />

      <DateField
        label={t`To date`}
        value={filter.range?.to ?? new Date().toISOString()}
        onValueChange={(iso) => patchRange('to', iso)}
        disableFuture={false}
      />

      <TextField
        select
        fullWidth
        label={t`Client`}
        value={filter.clientId ?? ''}
        onChange={(event) => onFilterChange({ ...filter, clientId: event.target.value || undefined })}
      >
        <MenuItem value="">{t`All clients`}</MenuItem>
        {clients.map((client) => (
          <MenuItem key={client.id} value={client.id}>
            {client.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label={t`Channel`}
        value={filter.channel ?? ''}
        onChange={(event) => onFilterChange({ ...filter, channel: (event.target.value as Channel) || undefined })}
      >
        <MenuItem value="">{t`All channels`}</MenuItem>
        {CHANNELS.map((channel) => (
          <MenuItem key={channel} value={channel}>
            {i18n._(CHANNEL_LABELS[channel])}
          </MenuItem>
        ))}
      </TextField>

      <Button variant="outlined" disabled={!hasFilters} onClick={() => onFilterChange({})} sx={{ flexShrink: 0 }}>
        {t`Clear filters`}
      </Button>
    </Stack>
  )
}
