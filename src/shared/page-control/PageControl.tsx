import { useLingui } from '@lingui/react/macro'
import { MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material'
import { radius } from 'src/core/theme'
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
 * The ledger's pagination footer (`256:945`).
 *
 * Three equal columns: the result summary on the reading edge, the page
 * controls centred, and the rows-per-page select opposite. Each control is a
 * 36px pill in a 44px hit area, the current page filled in `brand-primary`.
 *
 * Summary first in the DOM so RTL puts it on the right, matching the frame.
 * MUI's `Pagination` is direction-aware, so the arrows mirror on their own.
 */
export const PageControl = ({ page, pageCount, pageSize, totalCount, onPageChange, onPageSizeChange }: PageControlProps) => {
  const { t } = useLingui()
  const { digits } = useFormat()

  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, totalCount)

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 3, width: '100%' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'start' }}>
        {t`Showing ${digits(firstRow)} to ${digits(lastRow)} of ${digits(totalCount)} receipts`}
      </Typography>

      <Pagination
        page={page}
        count={Math.max(1, pageCount)}
        onChange={(_event, next) => onPageChange(next)}
        siblingCount={0}
        boundaryCount={1}
        sx={(theme) => ({
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          '& .MuiPagination-ul': { flexWrap: 'nowrap' },
          '& .MuiPaginationItem-root': {
            width: 36,
            height: 36,
            margin: '0 4px',
            borderRadius: `${radius.sm}px`,
            ...theme.typography.subtitle2,
            color: theme.palette.text.primary,
            '&.Mui-selected': {
              backgroundColor: theme.palette.brandPrimary,
              color: theme.palette.textOnPrimary,
              '&:hover': { backgroundColor: theme.palette.brandPrimaryHover },
            },
          },
        })}
      />

      <Stack sx={{ flex: 1, alignItems: 'flex-end' }}>
        <TextField
          select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          sx={(theme) => ({
            width: 190,
            '& .MuiOutlinedInput-root': {
              height: 44,
              borderRadius: `${radius.sm + 2}px`,
              fontSize: 13,
              fontWeight: 500,
              color: theme.palette.text.secondary,
            },
            '& .MuiSelect-select': { paddingBlock: '0px', paddingInlineStart: '16px' },
          })}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {t`${digits(option)} rows per page`}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Stack>
  )
}
