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
        label="از تاریخ"
        value={filter.range?.from ?? new Date().toISOString()}
        onValueChange={(iso) => patchRange('from', iso)}
        disableFuture={false}
      />

      <DateField
        label="تا تاریخ"
        value={filter.range?.to ?? new Date().toISOString()}
        onValueChange={(iso) => patchRange('to', iso)}
        disableFuture={false}
      />

      <TextField
        select
        fullWidth
        label="مشتری"
        value={filter.clientId ?? ''}
        onChange={(event) => onFilterChange({ ...filter, clientId: event.target.value || undefined })}
      >
        <MenuItem value="">همه‌ی مشتری‌ها</MenuItem>
        {clients.map((client) => (
          <MenuItem key={client.id} value={client.id}>
            {client.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="کانال"
        value={filter.channel ?? ''}
        onChange={(event) => onFilterChange({ ...filter, channel: (event.target.value as Channel) || undefined })}
      >
        <MenuItem value="">همه‌ی کانال‌ها</MenuItem>
        {CHANNELS.map((channel) => (
          <MenuItem key={channel} value={channel}>
            {CHANNEL_LABELS[channel]}
          </MenuItem>
        ))}
      </TextField>

      <Button variant="outlined" disabled={!hasFilters} onClick={() => onFilterChange({})} sx={{ flexShrink: 0 }}>
        پاک کردن فیلترها
      </Button>
    </Stack>
  )
}
