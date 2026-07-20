import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, MenuItem, Select, type SelectProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface RangeSelectOption {
  value: number | string
  label: string
}

export interface RangeSelectProps extends Omit<SelectProps<string>, 'onChange' | 'onSelect' | 'value' | 'renderValue'> {
  value: number | string
  options: RangeSelectOption[]
  onSelect: (value: string) => void
  /** Prefixed to the selected label, e.g. "Report range: year 1403". */
  prefix: string
}

/**
 * The design's report-range control (`183:289` / `359:766`): a pill, not a
 * boxed select. `surface-default` with a 1px `border-default` hairline, fully
 * rounded, 38px tall, chevron on the leading edge, label 14/600.
 *
 * The chevron is drawn inside `renderValue` rather than through MUI's
 * `IconComponent`. MUI positions that icon absolutely with a physical `right`,
 * which the RTL plugin flips underneath us — the icon ended up invisible. A
 * flex row here gives the design's exact 16px glyph and 8px gap in both
 * directions.
 */
export const RangeSelect = ({ value, options, onSelect, prefix, sx, ...props }: RangeSelectProps) => (
  <Select
    {...props}
    value={String(value)}
    onChange={(event) => onSelect(event.target.value)}
    renderValue={(selected) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
          {`${prefix}: ${options.find((option) => String(option.value) === selected)?.label ?? selected}`}
        </Box>
      </Box>
    )}
    sx={[
      (theme) => ({
        height: 38,
        borderRadius: `${radius.full}px`,
        backgroundColor: theme.palette.surfaceDefault,
        color: theme.palette.text.primary,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '22px',
        // The pill's own hairline, so the notched outline is hidden rather
        // than fought with.
        border: `1px solid ${theme.palette.borderDefault}`,
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        // MUI's built-in dropdown icon is replaced by the one in `renderValue`.
        '& .MuiSelect-icon': { display: 'none' },
        '& .MuiSelect-select': {
          // The design pads 12 on the chevron edge and 16 on the text edge.
          paddingBlock: 0,
          paddingInlineStart: '12px',
          paddingInlineEnd: '16px !important',
          minHeight: 'auto',
          display: 'flex',
          alignItems: 'center',
        },
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
