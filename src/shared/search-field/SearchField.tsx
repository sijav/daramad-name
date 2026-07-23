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
 * NOT a pill: it shares its 10px radius with the filter button beside it.
 *
 * The clear button appears only once there is something to clear, since a
 * permanent one reads as "this filter is active" when it is not.
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
        // The design draws no label above this field, so a screen reader had
        // nothing to announce but "edit text", a placeholder is not an
        // accessible name, and it disappears the moment anything is typed.
        htmlInput: { 'aria-label': t`Search receipts` },
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
          // The root carries the inset here, because the magnifier adornment
          // has to sit inside it.
          '& .MuiOutlinedInput-input': { paddingInline: 0 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
