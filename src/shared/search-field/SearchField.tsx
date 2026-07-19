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
 * The ledger's search field.
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
      sx={[{ '& .MuiOutlinedInput-root': { borderRadius: `${radius.full}px`, height: 48 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  )
}
