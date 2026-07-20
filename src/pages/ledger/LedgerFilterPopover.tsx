import { Trans, useLingui } from '@lingui/react/macro'
import { Autocomplete, Button, MenuItem, Popover, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { DateField } from 'src/shared/date-field'
import { clientsQueryKey, getClientsQuery } from 'src/shared/queries'
import { CHANNELS, type Channel, type LedgerFilter } from 'src/shared/types'

export interface LedgerFilterPopoverProps {
  anchorEl: HTMLElement | null
  filter: LedgerFilter
  onApply: (filter: LedgerFilter) => void
  onClose: () => void
}

/**
 * The design's filter popover.
 *
 * Edits a draft and only commits on Apply. Live-applying each keystroke would
 * refetch the ledger on every change and make the date range unusable — the
 * intermediate "from > to" state would briefly match nothing.
 */
export const LedgerFilterPopover = ({ anchorEl, filter, onApply, onClose }: LedgerFilterPopoverProps) => {
  const { t, i18n } = useLingui()
  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })
  const [draft, setDraft] = useState<LedgerFilter>(filter)

  const patchRange = (key: 'from' | 'to', iso: string) => {
    const now = new Date().toISOString()
    const range = draft.range ?? { from: now, to: now }
    setDraft({ ...draft, range: { ...range, [key]: iso } })
  }

  return (
    <Popover
      open={anchorEl !== null}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 420, p: 2.5 } } }}
    >
      <Stack spacing={2}>
        <DateField
          label={t`From date`}
          value={draft.range?.from ?? new Date().toISOString()}
          onValueChange={(iso) => patchRange('from', iso)}
          disableFuture={false}
        />

        <DateField
          label={t`To date`}
          value={draft.range?.to ?? new Date().toISOString()}
          onValueChange={(iso) => patchRange('to', iso)}
          disableFuture={false}
        />

        {/* Searchable, not a bare dropdown. A freelancer accumulates dozens of
            clients, and scrolling a flat menu to find one is the slow path the
            design's search field exists to avoid. */}
        <Autocomplete
          options={clients}
          getOptionLabel={(client) => client.name}
          value={clients.find((client) => client.id === draft.clientId) ?? null}
          onChange={(_event, client) => setDraft({ ...draft, clientId: client?.id ?? undefined })}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={t`No matching client`}
          renderInput={(params) => <TextField {...params} label={t`Client`} placeholder={t`All clients`} />}
        />

        <TextField
          select
          fullWidth
          label={t`Channel`}
          value={draft.channel ?? ''}
          onChange={(event) => setDraft({ ...draft, channel: (event.target.value as Channel) || undefined })}
        >
          <MenuItem value="">{t`All channels`}</MenuItem>
          {CHANNELS.map((channel) => (
            <MenuItem key={channel} value={channel}>
              {i18n._(CHANNEL_LABELS[channel])}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" sx={{ flex: 1 }} onClick={() => onApply(draft)}>
            <Trans>Apply filters</Trans>
          </Button>
          <Button variant="outlined" onClick={() => setDraft({})}>
            <Trans>Reset</Trans>
          </Button>
        </Stack>
      </Stack>
    </Popover>
  )
}
