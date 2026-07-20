import { useLingui } from '@lingui/react/macro'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { radius } from 'src/core/theme'

export type SearchFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}

/**
 * The ledger's search field (`278:1018`): 48px tall, radius 10 on
 * `surface-default` with a 1px `border-default` hairline, magnifier on the
 * leading edge.
 *
 * NOT a pill — an earlier pass recorded it as fully rounded, which was wrong;
 * it shares the 10px radius with the filter button standing next to it.
 *
 * The clear button only appears once there is something to clear — a permanent
 * one reads as "this filter is active" even when it is not.
 */
export const SearchField = ({ value, onValueChange, placeholder, sx, ...props }: SearchFieldProps) => {
  const { t } = useLingui()

  return (
    <TextField
      {...props}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={placeholder ?? t`Search by client, note or amount`}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onValueChange('')} aria-label={t`Clear search`}>
                <ClearRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={[
        {
          // Only the departures from the theme's `Field`: this one is 48px at
          // radius 10, and 14/400 rather than 16.
          '& .MuiOutlinedInput-root': {
            borderRadius: `${radius.sm + 2}px`,
            height: 48,
            paddingInline: '16px',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: '24px',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
