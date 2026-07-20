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
        alignItems: 'center',
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
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: dotColour(tone, theme),
        }}
      />
      <Typography variant="body2">{message}</Typography>
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

const dotColour = (tone: InsightTone, theme: Theme): string => {
  switch (tone) {
    case 'info':
      return theme.palette.primary.main
    case 'positive':
      return theme.palette.success.main
    case 'warning':
    default:
      return theme.palette.warning.main
  }
}
