import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { elevation, radius } from 'src/core/theme'
import { MoneyText } from 'src/shared/money-text'

export interface SummaryCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  hint?: string
  emphasis?: boolean
}

/**
 * The design's dashboard `Card`: a tinted icon chip and a small label on one
 * row, the figure beneath.
 *
 * Flat, not frosted: `surface-default` with a 1px `border-default` hairline,
 * 20px radius and the Elevation/1 shadow.
 */
export const SummaryCard = ({ label, value, icon, hint, emphasis = false }: SummaryCardProps) => (
  <Paper
    elevation={0}
    sx={(theme) => ({
      height: '100%',
      px: 2.5,
      py: 2.25,
      containerType: 'inline-size',
      borderRadius: `${radius.xl}px`,
      backgroundColor: emphasis ? theme.palette.primary.light : theme.palette.surfaceDefault,
      border: `1px solid ${emphasis ? theme.palette.primary.main : theme.palette.borderDefault}`,
      boxShadow: elevation.level1,
    })}
  >
    <Stack spacing={1.25}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          variant="caption"
          // `minWidth: 0` lets a long English label wrap instead of pushing the
          // icon chip out of the row.
          sx={{ fontWeight: 500, lineHeight: '16px', minWidth: 0 }}
          color={emphasis ? 'primary.dark' : 'text.secondary'}
        >
          {label}
        </Typography>

        {icon ? (
          <Box
            sx={(theme) => ({
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: `${radius.sm}px`,
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.main,
              '& svg': { fontSize: 18 },
            })}
          >
            {icon}
          </Box>
        ) : null}
      </Stack>

      {typeof value === 'number' ? (
        <MoneyText
          value={value}
          color={emphasis ? 'primary.dark' : 'text.primary'}
          sx={{
            display: 'block',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            fontWeight: 600,
            lineHeight: '28px',
            // 20px is the design's size; it only shrinks when a long English
            // label squeezes the card below its natural width.
            fontSize: 'clamp(1rem, 5.2cqw, 1.25rem)',
          }}
        />
      ) : (
        <Typography color={emphasis ? 'primary.dark' : 'text.primary'} sx={{ fontSize: 20, fontWeight: 600, lineHeight: '28px' }}>
          {value}
        </Typography>
      )}

      {hint ? (
        <Typography sx={{ color: 'text.secondary' }} variant="caption">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
)
