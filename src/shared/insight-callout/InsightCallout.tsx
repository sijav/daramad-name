import { Box, Stack, Typography } from '@mui/material'
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
export const InsightCallout = ({ message, tone = 'warning' }: InsightCalloutProps) => (
  <Stack
    direction="row"
    spacing={1.5}
    sx={(theme) => ({
      alignItems: 'center',
      px: 2,
      py: 1.5,
      borderRadius: `${radius.md}px`,
      backgroundColor: theme.palette.surfaceContainerHigh,
      border: `1px solid ${theme.palette.outlineVariant}`,
    })}
  >
    <Box
      sx={{
        flexShrink: 0,
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: dotColour(tone),
      }}
    />
    <Typography variant="body2">{message}</Typography>
  </Stack>
)

const dotColour = (tone: InsightTone): string => {
  switch (tone) {
    case 'info':
      return '#3b6ef5'
    case 'positive':
      return '#1f6f43'
    case 'warning':
    default:
      return '#e0a800'
  }
}
