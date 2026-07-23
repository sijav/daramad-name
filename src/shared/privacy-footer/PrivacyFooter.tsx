import { Trans } from '@lingui/react/macro'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Stack, Typography } from '@mui/material'

/**
 * The privacy line, which is literally true: no backend, no network request
 * carrying user data, and the only way anything leaves the browser is a backup
 * file the user downloads.
 *
 * Do not add `opacity` here. It is not a colour, so the palette's contrast work
 * does not reach it: 0.75 composited `text.secondary` down to 3.28:1 at 12px,
 * against a 4.5:1 bar. The token alone is 5.56:1 on `surface-subtle` and is
 * already the quieter ink.
 */
export const PrivacyFooter = () => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', mt: 6, pt: 3 }}>
    <LockRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
      <Trans>All your data stays in your own browser and is never sent anywhere.</Trans>
    </Typography>
  </Stack>
)
