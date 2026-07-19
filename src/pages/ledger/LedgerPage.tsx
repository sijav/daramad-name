import { useLingui } from '@lingui/react/macro'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { Box, CircularProgress, Grid } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invalidateReceiptQueries, useSettings } from 'src/core/query'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { EmptyState } from 'src/shared/empty-state'
import { GlassCard } from 'src/shared/glass-card'
import { PageHeader } from 'src/shared/page-header'
import { deleteReceiptMutation, getLedgerQuery, getLedgerQueryKey } from 'src/shared/queries'
import { StatTile } from 'src/shared/stat-tile'
import type { LedgerFilter, LedgerSort, ReceiptWithClient } from 'src/shared/types'
import { toPersianDigits } from 'src/shared/utils'
import { EditReceiptDialog } from './EditReceiptDialog'
import { LedgerFilters } from './LedgerFilters'
import { LedgerTable } from './LedgerTable'

/** Scenario 2: the ledger, its filters, and a total that always matches what is on screen. */
export const LedgerPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const [filter, setFilter] = useState<LedgerFilter>({})
  const [sort, setSort] = useState<LedgerSort>({ field: 'occurredAt', direction: 'desc' })
  const [editing, setEditing] = useState<ReceiptWithClient | null>(null)
  const [deleting, setDeleting] = useState<ReceiptWithClient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: getLedgerQueryKey(filter, sort, calendar),
    queryFn: getLedgerQuery,
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteReceiptMutation,
    onSuccess: async () => {
      await invalidateReceiptQueries()
      setDeleting(null)
    },
  })

  const hasAnyReceipts = (data?.receipts.length ?? 0) > 0
  const isFiltered = Boolean(filter.range || filter.clientId || filter.channel)

  return (
    <Box>
      <PageHeader title={t`دفتر درآمد`} subtitle={t`همه‌ی دریافتی‌هایت، با جمع دقیق`} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile label={t`جمع کل`} value={data?.summary.totalToman ?? 0} emphasis />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile label={t`میانگین ماهانه`} value={data?.summary.monthlyAverageToman ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile label={t`تعداد دریافتی`} value={toPersianDigits(data?.summary.receiptCount ?? 0)} />
        </Grid>
      </Grid>

      <GlassCard>
        <LedgerFilters filter={filter} onFilterChange={setFilter} />

        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : hasAnyReceipts ? (
          <LedgerTable
            receipts={data?.receipts ?? []}
            summary={data?.summary ?? { totalToman: 0, receiptCount: 0, monthlyAverageToman: 0 }}
            sort={sort}
            calendar={calendar}
            onSortChange={setSort}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : isFiltered ? (
          <EmptyState
            title={t`با این فیلترها چیزی پیدا نشد`}
            description={t`بازه‌ی تاریخ یا مشتری را عوض کن، یا فیلترها را پاک کن تا همه‌ی دریافتی‌ها را ببینی.`}
            actionLabel={t`پاک کردن فیلترها`}
            onAction={() => setFilter({})}
          />
        ) : (
          <EmptyState
            icon={<ReceiptLongRoundedIcon />}
            title={t`هنوز دریافتی‌ای ثبت نکردی`}
            description={t`دفتر درآمد جاییه که همه‌ی پول‌هایی که گرفتی یک‌جا جمع می‌شه — همون چیزی که موقع گزارش گرفتن لازمت می‌شه.`}
            actionLabel={t`ثبت اولین دریافتی`}
            onAction={() => navigate('/')}
          />
        )}
      </GlassCard>

      {editing ? <EditReceiptDialog receipt={editing} onClose={() => setEditing(null)} /> : null}

      <ConfirmDialog
        open={deleting !== null}
        title={t`حذف دریافتی`}
        description={t`این دریافتی از دفتر حذف می‌شه و جمع‌ها و نمودارها به‌روز می‌شن. این کار برگشت‌پذیر نیست.`}
        confirmLabel={t`حذف کن`}
        destructive
        onConfirm={() => deleting && remove({ id: deleting.id })}
        onClose={() => setDeleting(null)}
      />
    </Box>
  )
}
