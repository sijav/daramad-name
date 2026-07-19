import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Alert, type AlertProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface InsightBannerProps extends Omit<AlertProps, 'children'> {
  message: string
}

/**
 * The one-line insight under the client-share chart.
 *
 * Deliberately `warning` rather than `error`: depending on one client is a
 * business risk worth naming, not a mistake the user made. The tone matters —
 * the interface voice is friendly-professional, not scolding.
 */
export const InsightBanner = ({ message, sx, ...props }: InsightBannerProps) => (
  <Alert
    severity="warning"
    icon={<WarningAmberRoundedIcon />}
    sx={[{ borderRadius: `${radius.md}px`, alignItems: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
    {...props}
  >
    {message}
  </Alert>
)
