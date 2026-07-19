import { useLingui } from '@lingui/react/macro'
import { MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material'
import { useFormat } from 'src/shared/format'
import { PAGE_SIZE_OPTIONS } from './pageSizes'

export interface PageControlProps {
  page: number
  pageCount: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

/**
 * Pagination for the ledger.
 *
 * MUI's `Pagination` is direction-aware, so the previous/next arrows mirror
 * correctly in RTL without any work here. The row count is stated in words
 * beside it because a bare page number does not tell the user whether their
 * filter matched 12 receipts or 126.
 */
export const PageControl = ({ page, pageCount, pageSize, totalCount, onPageChange, onPageSizeChange }: PageControlProps) => {
  const { t } = useLingui()
  const { digits } = useFormat()

  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, totalCount)

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 2, width: '100%' }}
    >
      <Typography variant="caption" color="text.secondary">
        {t`Showing ${digits(firstRow)}–${digits(lastRow)} of ${digits(totalCount)}`}
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <TextField
          select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          label={t`Rows`}
          sx={{ minWidth: 104 }}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {digits(option)}
            </MenuItem>
          ))}
        </TextField>

        <Pagination
          page={page}
          count={Math.max(1, pageCount)}
          onChange={(_event, next) => onPageChange(next)}
          shape="rounded"
          color="primary"
          siblingCount={0}
          boundaryCount={1}
        />
      </Stack>
    </Stack>
  )
}
