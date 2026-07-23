import { Trans, useLingui } from '@lingui/react/macro'
import { Autocomplete, Button, MenuItem, Popover, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { DateField } from 'src/shared/date-field'
import { clientsQueryKey, getClientsQuery } from 'src/shared/queries'
import { CHANNELS, type LedgerFilter } from 'src/shared/types'

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
 * refetch the ledger on every change and make the date range unusable, the
 * intermediate "from > to" state would briefly match nothing.
 */
export const LedgerFilterPopover = ({ anchorEl, filter, onApply, onClose }: LedgerFilterPopoverProps) => {
  const { t, i18n } = useLingui()
  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })
  const open = anchorEl !== null
  const [draft, setDraft] = useState<LedgerFilter>(filter)
  const [wasOpen, setWasOpen] = useState(open)

  // The page keeps this mounted and only moves the anchor, so the draft outlives
  // every close. Reseeding on the way open is what stops a filter the user
  // removed from the chips being put back by the next Apply, which would
  // otherwise read a draft that never heard about the removal.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(filter)
    }
  }

  /**
   * Sets one end of the range and makes the other end VISIBLE.
   *
   * The fields start empty, since a popover opening with today in both boxes
   * advertises a range that is not applied. Inventing the missing end instead
   * built `{ from: today, to: <past date> }` from a lone "to" date, which is
   * inverted and matches nothing in Dexie, with nothing on screen saying so.
   * Whatever the counterpart becomes is written to the draft AND shown in its
   * field, so what the user reads is what gets applied.
   */
  const patchRange = (key: 'from' | 'to', iso: string) => {
    const today = new Date().toISOString()
    const from = key === 'from' ? iso : draft.range?.from
    const to = key === 'to' ? iso : draft.range?.to

    if (key === 'from') {
      // A range must not end before it starts; today is the natural other end
      // unless the chosen start is itself in the future.
      const end = to && to >= iso ? to : iso > today ? iso : today
      setDraft({ ...draft, range: { from: iso, to: end } })
      return
    }
    const start = from && from <= iso ? from : iso
    setDraft({ ...draft, range: { from: start, to: iso } })
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 420, p: 2.5 } } }}
    >
      <Stack spacing={2}>
        <DateField
          label={t`From date`}
          value={draft.range?.from ?? null}
          onValueChange={(iso) => patchRange('from', iso)}
          disableFuture={false}
        />

        <DateField
          label={t`To date`}
          value={draft.range?.to ?? null}
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
          // Matched against the runtime list rather than cast: the empty option
          // is "all channels", which is `undefined` on the filter.
          onChange={(event) => setDraft({ ...draft, channel: CHANNELS.find((channel) => channel === event.target.value) })}
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
