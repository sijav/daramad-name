import { Box, Stack, Typography, type Theme } from '@mui/material'
import { radius } from 'src/core/theme'

export type InsightTone = 'warning' | 'info'

export interface InsightCalloutProps {
  message: string
  tone?: InsightTone
}

/**
 * The design's `Insight/Callout`: a single sentence under a chart, marked with
 * a coloured dot rather than an alert icon.
 *
 * Deliberately softer than an alert. Client concentration is a fact worth
 * naming, not an error the user made, and an alert triangle over their own
 * income chart reads as an accusation.
 */
export const InsightCallout = ({ message, tone = 'warning' }: InsightCalloutProps) => (
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
      sx={(theme) => ({
        flexShrink: 0,
        marginBlockStart: '6px',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: toneColour(tone, theme),
      })}
    />
    {/* `153:677`: the sentence carries the tone's own colour at 14/600
        it is the point of the callout, not body copy inside it. */}
    <Typography variant="subtitle2" sx={(theme) => ({ color: toneColour(tone, theme) })}>
      {message}
    </Typography>
  </Stack>
)

/** The design tints the callout with the subtle pair of its dot colour. */
const toneSurface = (tone: InsightTone, theme: Theme): string =>
  tone === 'info' ? theme.palette.brandPrimarySubtle : theme.palette.warning.light

/**
 * One colour for the dot and the sentence, the design draws them as a pair, so
 * there is nothing for a second accessor to say.
 *
 * On `info` it is `brandPrimary`, not `primary.main`. The sentence is 14/600
 * type on `brand-primary-subtle`: #3b6ef5 measures 3.99:1 there, under the
 * 4.5:1 bar, while #3460d6 reaches 4.99:1. `primary` is the container role in
 * this palette, it never draws type, so the blue an insight speaks in is the
 * brand one.
 */
const toneColour = (tone: InsightTone, theme: Theme): string => (tone === 'info' ? theme.palette.brandPrimary : theme.palette.warning.main)
