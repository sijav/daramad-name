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
  const open = anchorEl !== null
  const [draft, setDraft] = useState<LedgerFilter>(filter)
  const [wasOpen, setWasOpen] = useState(open)

  // The page keeps this mounted and only moves the anchor, so the draft outlives
  // every close. Reseeding it on the way open is what stops a filter the user
  // removed from the chips — or cleared entirely — from being silently put back
  // by the next Apply, which reads a draft that never heard about the removal.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(filter)
    }
  }

  /**
   * Sets one end of the range and makes the other end VISIBLE.
   *
   * The fields start empty, because a popover that opens showing today in both
   * boxes advertises a range that is not applied — pressing Apply on it filtered
   * nothing. And the previous fallback silently invented the missing end, so
   * picking only a "to" date built `{from: today, to: <past date>}`, an inverted
   * range Dexie matches nothing for, with no explanation on screen.
   *
   * So whatever the counterpart becomes, it is written into the draft and shown
   * in its own field. What the user reads is what gets applied.
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
