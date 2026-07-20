import { Stack, Typography } from '@mui/material'

export interface DocumentRowProps {
  label: string
  value: string
}

/**
 * One metadata line of the report document — name, range, issue date.
 *
 * The label sits on the reading edge and the value opposite it, which is how
 * the design lays out the certificate header.
 */
export const DocumentRow = ({ label, value }: DocumentRowProps) => (
  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
    <Typography sx={{ color: 'text.secondary' }} variant="caption">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Stack>
)
