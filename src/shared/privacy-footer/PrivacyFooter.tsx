import { Trans } from '@lingui/react/macro'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Stack, Typography } from '@mui/material'

/**
 * Rule 8. This sentence is literally true: the app has no backend, makes no
 * network requests with user data, and the only way anything leaves the browser
 * is the backup file the user downloads themselves.
 */
export const PrivacyFooter = () => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', mt: 6, pt: 3, opacity: 0.75 }}>
    <LockRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
      <Trans>All your data stays in your own browser and is never sent anywhere.</Trans>
    </Typography>
  </Stack>
)
