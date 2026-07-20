import { useLingui } from '@lingui/react/macro'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Grid, Stack, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { invalidateReceiptQueries } from 'src/core/query'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { CHANNEL_LABELS } from 'src/shared/constants'
import { FilterButton } from 'src/shared/filter-button'
import { FilterChip } from 'src/shared/filter-chip'
import { useFormat } from 'src/shared/format'
import { LedgerState } from 'src/shared/ledger-state'
import { PageControl } from 'src/shared/page-control'
import { PageHeader } from 'src/shared/page-header'
import { clientsQueryKey, deleteReceiptMutation, getClientsQuery, getLedgerQuery, getLedgerQueryKey } from 'src/shared/queries'
import { ReceiptDetailsDrawer } from 'src/shared/receipt-details-drawer'
import { SearchField } from 'src/shared/search-field'
import { StatTile } from 'src/shared/stat-tile'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ReceiptWithClient } from 'src/shared/types'
import { EditReceiptDialog } from './EditReceiptDialog'
import { LedgerFilterPopover } from './LedgerFilterPopover'
import { LedgerTable } from './LedgerTable'
import { useLedgerView } from './useLedgerView'

/**
 * Scenario 2's ledger, rebuilt to the redesign: search, a filter popover with
 * removable active-filter chips, pagination, a row-actions menu and a details
 * drawer.
 */
export const LedgerPage = () => {
  const { t, i18n } = useLingui()
  const navigate = useNavigate()
  const { digits, dateLong } = useFormat()
  const view = useLedgerView()

  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [viewing, setViewing] = useState<ReceiptWithClient | null>(null)
  const [editing, setEditing] = useState<ReceiptWithClient | null>(null)
  const [deleting, setDeleting] = useState<ReceiptWithClient | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: getLedgerQueryKey(view.filter, view.sort, view.calendar),
    queryFn: getLedgerQuery,
  })
  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })

  const paged = view.paginate(data?.receipts ?? [])

  const { mutate: remove } = useMutation({
    mutationFn: deleteReceiptMutation,
    onSuccess: async () => {
      await invalidateReceiptQueries()
      setDeleting(null)
      setViewing(null)
    },
  })

  const isFiltered = view.activeFilterCount > 0 || view.search.trim() !== ''
  const stateKind = isError ? 'error' : isLoading ? 'loading' : paged.matchedCount === 0 ? (isFiltered ? 'no-results' : 'empty') : null

  const stateAction = () => {
    if (stateKind === 'error') {
      void refetch()
      return
    }
    if (stateKind === 'no-results') {
      view.clearAll()
      return
    }
    navigate('/quick-entry')
  }

  return (
    <Box>
      <PageHeader
        title={t`Income ledger`}
        subtitle={t`${digits(paged.matchedCount)} receipts in the selected range`}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/quick-entry')}>
            {t`Record a receipt`}
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile label={t`Total`} value={data?.summary.totalToman ?? 0} emphasis />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile label={t`Monthly average`} value={data?.summary.monthlyAverageToman ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile label={t`Receipts`} value={digits(data?.summary.receiptCount ?? 0)} />
        </Grid>
      </Grid>

      <SurfaceCard>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { md: 'center' } }}>
          <FilterButton
            activeCount={view.activeFilterCount}
            onClick={(event: MouseEvent<HTMLElement>) => setFilterAnchor(event.currentTarget)}
          />
          <SearchField value={view.search} onValueChange={view.setSearch} fullWidth />
        </Stack>

        {view.activeFilterCount > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
            {view.filter.range ? (
              <FilterChip
                field={t`Range`}
                value={`${dateLong(view.filter.range.from)} – ${dateLong(view.filter.range.to)}`}
                onDelete={() => view.setFilter({ ...view.filter, range: undefined })}
              />
            ) : null}
            {view.filter.clientId ? (
              <FilterChip
                field={t`Client`}
                value={clients.find((client) => client.id === view.filter.clientId)?.name ?? t`Unknown`}
                onDelete={() => view.setFilter({ ...view.filter, clientId: undefined })}
              />
            ) : null}
            {view.filter.channel ? (
              <FilterChip
                field={t`Channel`}
                value={i18n._(CHANNEL_LABELS[view.filter.channel])}
                onDelete={() => view.setFilter({ ...view.filter, channel: undefined })}
              />
            ) : null}
          </Stack>
        ) : null}

        {stateKind ? (
          <LedgerState kind={stateKind} onAction={stateAction} />
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {t`${digits(paged.matchedCount)} results based on the active filters`}
            </Typography>

            <LedgerTable
              receipts={paged.rows}
              summary={data?.summary ?? { totalToman: 0, receiptCount: 0, monthlyAverageToman: 0 }}
              sort={view.sort}
              calendar={view.calendar}
              onSortChange={view.setSort}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={setDeleting}
            />

            <PageControl
              page={paged.page}
              pageCount={paged.pageCount}
              pageSize={view.pageSize}
              totalCount={paged.matchedCount}
              onPageChange={view.setPage}
              onPageSizeChange={view.setPageSize}
            />
          </>
        )}
      </SurfaceCard>

      <LedgerFilterPopover
        anchorEl={filterAnchor}
        filter={view.filter}
        onApply={(next) => {
          view.setFilter(next)
          setFilterAnchor(null)
        }}
        onClose={() => setFilterAnchor(null)}
      />

      <ReceiptDetailsDrawer
        receipt={viewing}
        onClose={() => setViewing(null)}
        onEdit={(receipt) => {
          setViewing(null)
          setEditing(receipt)
        }}
        onDelete={setDeleting}
      />

      {editing ? <EditReceiptDialog receipt={editing} onClose={() => setEditing(null)} /> : null}

      <ConfirmDialog
        open={deleting !== null}
        title={t`Delete receipt`}
        description={t`This receipt is removed from the ledger and the totals and charts update. This cannot be undone.`}
        confirmLabel={t`Delete it`}
        destructive
        onConfirm={() => deleting && remove({ id: deleting.id })}
        onClose={() => setDeleting(null)}
      />
    </Box>
  )
}
