import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { MenuItem, Select, type SelectProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface RangeSelectOption {
  value: number | string
  label: string
}

export interface RangeSelectProps extends Omit<SelectProps<string>, 'onChange' | 'onSelect' | 'value' | 'renderValue'> {
  value: number | string
  options: RangeSelectOption[]
  onSelect: (value: string) => void
  /** Prefixed to the selected label, e.g. "Report range: 1403". */
  prefix: string
}

/**
 * The design's report-range control (`183:289`): a pill, not a boxed select.
 *
 * `surface-default` with a 1px `border-default` hairline, fully rounded, 38px
 * tall, with the chevron on the leading edge and the label reading
 * "Report range: <value>". The header previously showed a separate `Tag` plus
 * an outlined dropdown; the design is one control.
 */
export const RangeSelect = ({ value, options, onSelect, prefix, sx, ...props }: RangeSelectProps) => (
  <Select
    {...props}
    value={String(value)}
    onChange={(event) => onSelect(event.target.value)}
    IconComponent={KeyboardArrowDownRoundedIcon}
    renderValue={(selected) => `${prefix}: ${options.find((option) => String(option.value) === selected)?.label ?? selected}`}
    sx={[
      (theme) => ({
        height: 38,
        borderRadius: `${radius.full}px`,
        backgroundColor: theme.palette.surfaceDefault,
        fontSize: 14,
        fontWeight: 600,
        // The pill's own hairline, so the underlying notched outline is hidden
        // rather than fought with.
        border: `1px solid ${theme.palette.borderDefault}`,
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiSelect-select': {
          paddingBlock: 0,
          paddingInlineStart: '16px',
          paddingInlineEnd: '38px !important',
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiSelect-icon': { insetInlineStart: 12, insetInlineEnd: 'auto', fontSize: 18 },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {options.map((option) => (
      <MenuItem key={option.value} value={String(option.value)}>
        {option.label}
      </MenuItem>
    ))}
  </Select>
)
