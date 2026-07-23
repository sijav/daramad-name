import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import { useRef, type KeyboardEvent } from 'react'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

export interface ChipSelectProps<T extends string> {
  /** Names the group. Required unless `labelId` names it instead. */
  label?: string
  /**
   * Id of a label drawn elsewhere — `Field`'s `labelId`, for a ChipSelect
   * sitting inside a field that already prints one. A `role="radiogroup"` is
   * not a labelable element, so a wrapping `<label>` never reaches it and the
   * association has to be spelled out. Without either prop the group has no
   * accessible name at all.
   */
  labelId?: string
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
 *
 * The `radiogroup` roles are backed by the behaviour they promise: one tab
 * stop, arrows moving the selection, wrapping at the ends. Nothing in MUI
 * supplies that for a row of chips — `ToggleButtonGroup`, which
 * `SegmentedControl` builds on, is a group of pressable buttons rather than
 * radios — so it is written out here. The roles without the traversal were
 * worse than plain buttons, because they tell a screen-reader user to reach
 * for arrow keys that did nothing.
 */
export const ChipSelect = <T extends string>({ label, labelId, value, options, onValueChange }: ChipSelectProps<T>) => {
  const { direction } = useTheme()
  const chips = useRef<(HTMLDivElement | null)[]>([])

  const selectedIndex = options.findIndex((option) => option.value === value)
  // A value matching no option would otherwise leave the group with no tab stop
  // at all, so the first pill takes it.
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex

  const select = (index: number) => {
    const wrapped = (index + options.length) % options.length
    onValueChange(options[wrapped].value)
    chips.current[wrapped]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Persian paints the row right-to-left, so ArrowRight walks towards the
    // PREVIOUS option. Taken from the theme, which is where the app's direction
    // is decided.
    const next = direction === 'rtl' ? -1 : 1
    const steps: Record<string, number | undefined> = {
      ArrowRight: next,
      ArrowLeft: -next,
      ArrowDown: 1,
      ArrowUp: -1,
      Home: -tabStop,
      End: options.length - 1 - tabStop,
    }

    const step = steps[event.key]
    if (step === undefined || options.length === 0) {
      return
    }
    // Arrows would scroll the page under the group, Home/End would jump it.
    event.preventDefault()
    select(tabStop + step)
  }

  return (
    <Box>
      {label ? (
        // `component="span"`, because MUI maps `subtitle2` onto `<h6>` and this
        // caption is not a heading — it announced "Payment channel, heading level
        // 6" in the middle of the record card. `Field` carries the same note.
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
              // The roving tab stop: Tab reaches the group once and lands on the
              // current choice, exactly as it does for native radios.
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
