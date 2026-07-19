import { Box, Chip, Stack, Typography } from '@mui/material'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

export interface ChipSelectProps<T extends string> {
  label?: string
  value: T
  options: readonly ChipOption<T>[]
  onValueChange: (value: T) => void
}

/**
 * The row of selectable pills used for the receipt channel.
 *
 * MUI's `Chip` gives the click target, keyboard handling and focus ring;
 * `filled` vs `outlined` carries the selected state, matching the design's
 * primary-container fill on the active pill.
 */
export const ChipSelect = <T extends string>({ label, value, options, onValueChange }: ChipSelectProps<T>) => (
  <Box>
    {label ? (
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
    ) : null}
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Chip
            key={option.value}
            label={option.label}
            role="radio"
            aria-checked={selected}
            variant={selected ? 'filled' : 'outlined'}
            onClick={() => onValueChange(option.value)}
            sx={(theme) => ({
              ...theme.typography.caption,
              ...(selected
                ? {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.dark,
                    border: `1px solid ${theme.palette.primary.main}`,
                  }
                : { borderColor: theme.palette.outlineVariant, color: theme.palette.text.secondary }),
            })}
          />
        )
      })}
    </Stack>
  </Box>
)
