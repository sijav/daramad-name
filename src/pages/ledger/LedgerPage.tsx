import { useLingui } from '@lingui/react/macro'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
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
import { SummaryCard } from 'src/shared/summary-card'
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
  const { dateRange, digits } = useFormat()
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
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button variant="contained" endIcon={<AddRoundedIcon />} onClick={() => navigate('/quick-entry')}>
              {t`Record a receipt`}
            </Button>
            <Button variant="contained" color="secondary" endIcon={<DescriptionRoundedIcon />} onClick={() => navigate('/report')}>
              {t`Income report`}
            </Button>
          </Stack>
        }
      />

      {/* The design puts the toolbar above the summary cards and outside any
          card — search leads, then filters, then the clear-all escape hatch. */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { md: 'center' } }}>
        <SearchField value={view.search} onValueChange={view.setSearch} fullWidth />
        <FilterButton
          activeCount={view.activeFilterCount}
          onClick={(event: MouseEvent<HTMLElement>) => setFilterAnchor(event.currentTarget)}
        />
        {isFiltered ? (
          <Button variant="text" onClick={() => view.clearAll()} sx={{ flexShrink: 0 }}>
            {t`Clear all`}
          </Button>
        ) : null}
      </Stack>

      {view.activeFilterCount > 0 ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
          {view.filter.range ? (
            <FilterChip
              field={t`Range`}
              value={dateRange(view.filter.range.from, view.filter.range.to)}
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label={t`Receipts`} value={digits(data?.summary.receiptCount ?? 0)} icon={<ReceiptLongRoundedIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard
            label={t`Monthly average`}
            value={data?.summary.monthlyAverageToman ?? 0}
            hint={t`divided by ${digits(data?.summary.monthsInRange ?? 1)} months`}
            icon={<ShowChartRoundedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label={t`Total`} value={data?.summary.totalToman ?? 0} icon={<PaymentsRoundedIcon />} />
        </Grid>
      </Grid>

      {stateKind ? (
        <SurfaceCard flat>
          <LedgerState kind={stateKind} onAction={stateAction} />
        </SurfaceCard>
      ) : (
        <>
          {/* `267:980`: the count leads at 16/600, the qualifier trails at
              12/400 on the same baseline. */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
            <Typography variant="h5">{t`${digits(paged.matchedCount)} results`}</Typography>
            <Typography sx={{ color: 'text.secondary' }} variant="caption">
              {t`based on the active filters`}
            </Typography>
          </Stack>

          <SurfaceCard flat disablePadding>
            <LedgerTable
              receipts={paged.rows}
              summary={data?.summary ?? { totalToman: 0, receiptCount: 0, monthlyAverageToman: 0, monthsInRange: 1 }}
              sort={view.sort}
              filtered={isFiltered}
              calendar={view.calendar}
              onSortChange={view.setSort}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </SurfaceCard>

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
