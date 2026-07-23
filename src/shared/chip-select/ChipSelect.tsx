import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import { useRef, type KeyboardEvent } from 'react'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

export interface ChipSelectProps<T extends string> {
  label?: string
  // A `role="radiogroup"` is not a labelable element, so a wrapping `<label>`
  // never names it. `Field` passes its `labelId` here instead.
  labelId?: string
  value: T
  options: readonly ChipOption<T>[]
  onValueChange: (value: T) => void
}

/**
 * `Chip` supplies the click target, keyboard activation and focus ring;
 * `filled` vs `outlined` carries the selected state.
 *
 * The radiogroup traversal is written out here because `ToggleButtonGroup`,
 * which `SegmentedControl` uses, is a group of pressable buttons rather than
 * radios. Claiming the role commits to the behaviour: one tab stop, arrows
 * moving the selection, wrapping at the ends.
 */
export const ChipSelect = <T extends string>({ label, labelId, value, options, onValueChange }: ChipSelectProps<T>) => {
  const { direction } = useTheme()
  const chips = useRef<(HTMLDivElement | null)[]>([])

  // A value matching no option would leave the group with no tab stop, so the
  // first pill takes it.
  const tabStop = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  )

  const select = (index: number) => {
    const wrapped = (index + options.length) % options.length
    onValueChange(options[wrapped].value)
    chips.current[wrapped]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (options.length === 0) {
      return
    }
    // In RTL the row runs right to left, so ArrowRight moves to the PREVIOUS
    // option. Direction comes from the theme, which owns it.
    const forward = direction === 'rtl' ? -1 : 1
    const targets: Record<string, number | undefined> = {
      ArrowRight: tabStop + forward,
      ArrowLeft: tabStop - forward,
      ArrowDown: tabStop + 1,
      ArrowUp: tabStop - 1,
      Home: 0,
      End: options.length - 1,
    }

    const target = targets[event.key]
    if (target === undefined) {
      return
    }
    // Arrows would scroll the page under the group, Home/End would jump it.
    event.preventDefault()
    select(target)
  }

  return (
    <Box>
      {label ? (
        // MUI's default variant mapping sends `subtitle2` to `<h6>`; the theme
        // redirects it to `<p>`, and this caption is not a paragraph either.
        <Typography variant="subtitle2" component="span" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          {label}
        </Typography>
      ) : null}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
        role="radiogroup"
        aria-label={label}
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
      >
        {options.map((option, index) => {
          const selected = option.value === value
          return (
            <Chip
              key={option.value}
              ref={(node) => {
                chips.current[index] = node
              }}
              label={option.label}
              role="radio"
              aria-checked={selected}
              // Roving tab stop: Tab reaches the group once and lands on the
              // current choice, as it does for native radios.
              tabIndex={index === tabStop ? 0 : -1}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => onValueChange(option.value)}
              sx={(theme) => ({
                ...theme.typography.caption,
                // The design sets chip text in Medium; `caption` is Regular.
                fontWeight: 500,
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
}
