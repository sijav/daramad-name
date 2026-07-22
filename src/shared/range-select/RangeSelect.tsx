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
  /** Prefixed to the selected label, e.g. "Report range: year 1403". */
  prefix: string
}

/**
 * The design's report-range control (`183:289` / `359:766`): a pill, not a
 * boxed select. `surface-default` with a 1px `border-default` hairline, fully
 * rounded, 38px tall, chevron on the trailing edge, label 14/600.
 *
 * Everything positional here is written as a PHYSICAL property on purpose. The
 * stylis RTL plugin mirrors `right`/`paddingRight` in the generated CSS, so
 * authoring LTR values lands the chevron on the left in Persian — which is
 * where the design puts it. Two earlier attempts got this wrong: a logical
 * `insetInlineStart` fought MUI's own `right` and hid the glyph, and moving the
 * icon into `renderValue` put it on the right, because the first child of a
 * flex row is the RIGHTmost one in RTL.
 */
export const RangeSelect = ({ value, options, onSelect, prefix, sx, ...props }: RangeSelectProps) => (
  <Select
    // The pill draws no label of its own, and `role="combobox"` does not take
    // its name from its contents — so the control announced nothing at all
    // (axe: `aria-input-field-name`, serious). `prefix` is already the label
    // the design prints inside the pill, so naming the control with it also
    // keeps the visible text and the accessible name in agreement.
    //
    // Ahead of the spread, so a caller with a better name can still override.
    aria-label={prefix}
    {...props}
    value={String(value)}
    onChange={(event) => onSelect(event.target.value)}
    IconComponent={KeyboardArrowDownRoundedIcon}
    renderValue={(selected) => `${prefix}: ${options.find((option) => String(option.value) === selected)?.label ?? selected}`}
    sx={[
      (theme) => ({
        height: 38,
        borderRadius: `${radius.full}px`,
        color: theme.palette.text.primary,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '22px',
        paddingInline: 0,
        '& .MuiSelect-select': {
          paddingTop: 0,
          paddingBottom: 0,
          // 12 on the chevron edge, 16 on the text edge, both mirrored in RTL.
          paddingRight: '36px !important',
          paddingLeft: '16px',
          minHeight: 'auto',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        },
        '& .MuiSelect-icon': { right: 12, fontSize: 16, color: theme.palette.text.primary },
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
