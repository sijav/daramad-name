import { Trans } from '@lingui/react/macro'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Stack, Typography } from '@mui/material'

/**
 * Rule 8. This sentence is literally true: the app has no backend, makes no
 * network requests with user data, and the only way anything leaves the browser
 * is the backup file the user downloads themselves.
 *
 * It carried `opacity: 0.75`, which is not a colour and therefore not covered by
 * the palette's contrast work at all — it composited `text.secondary` #626569
 * down to #888a8e over the page's `surface-subtle` #f8f9fb, 3.28:1 at 12px
 * against a 4.5:1 bar. `text.secondary` on its own is 5.56:1 there. The one
 * promise this app makes about the user's data is not the line to whisper, and
 * the recession the opacity was after is already in the token: `text.secondary`
 * IS the quieter ink.
 */
export const PrivacyFooter = () => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', mt: 6, pt: 3 }}>
    <LockRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
      <Trans>All your data stays in your own browser and is never sent anywhere.</Trans>
    </Typography>
  </Stack>
)
