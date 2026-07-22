import { Box, Stack, Typography, useTheme, type Theme } from '@mui/material'
import { radius } from 'src/core/theme'

export type InsightTone = 'warning' | 'info' | 'positive'

export interface InsightCalloutProps {
  message: string
  tone?: InsightTone
}

/**
 * The design's `Insight/Callout`: a single sentence under a chart, marked with
 * a coloured dot rather than an alert icon.
 *
 * Softer than `InsightBanner` on purpose. Client concentration is a fact worth
 * naming, not an error the user made, and an alert triangle over their own
 * income chart reads as an accusation.
 */
export const InsightCallout = ({ message, tone = 'warning' }: InsightCalloutProps) => {
  const theme = useTheme()

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={(theme) => ({
        alignItems: 'flex-start',
        px: 2,
        py: 1.5,
        borderRadius: `${radius.md}px`,
        backgroundColor: toneSurface(tone, theme),
        border: `1px solid ${theme.palette.borderDefault}`,
      })}
    >
      <Box
        sx={{
          flexShrink: 0,
          marginBlockStart: '6px',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: dotColour(tone, theme),
        }}
      />
      {/* `153:677`: the sentence carries the tone's own colour at 14/600 —
          it is the point of the callout, not body copy inside it. */}
      <Typography variant="subtitle2" sx={{ color: toneColour(tone, theme) }}>
        {message}
      </Typography>
    </Stack>
  )
}

/** The design tints the callout with the subtle pair of its dot colour. */
const toneSurface = (tone: InsightTone, theme: Theme): string => {
  switch (tone) {
    case 'info':
      return theme.palette.brandPrimarySubtle
    case 'positive':
      return theme.palette.success.light
    case 'warning':
    default:
      return theme.palette.warning.light
  }
}

const toneColour = (tone: InsightTone, theme: Theme): string => dotColour(tone, theme)

const dotColour = (tone: InsightTone, theme: Theme): string => {
  switch (tone) {
    case 'info':
      // `brandPrimary`, not `primary.main`. The dot and the sentence are one
      // colour here, and the sentence is 14/600 type on `brand-primary-subtle`:
      // #3b6ef5 measures 3.99:1 there, under the 4.5:1 bar, while #3460d6
      // reaches 4.99:1. `primary` is the container role in this palette — it
      // never draws type — so the blue an insight speaks in is the brand one.
      return theme.palette.brandPrimary
    case 'positive':
      return theme.palette.success.main
    case 'warning':
    default:
      return theme.palette.warning.main
  }
}
