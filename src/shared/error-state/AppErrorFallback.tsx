import { Trans } from '@lingui/react/macro'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { FallbackProps } from 'react-error-boundary'

/**
 * Rule 9: no «خطایی رخ داد». Say what happened and what to do about it.
 *
 * The technical message is shown too — this is a tool holding someone's
 * financial history, and hiding the cause of a failure would leave them unable
 * to tell a transient glitch from real data loss.
 */
export const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', p: 3 }}>
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 460 }}>
      <ErrorOutlineRoundedIcon sx={{ fontSize: 48, color: 'error.main' }} />

      <Typography variant="h2">
        <Trans>یه جای کار خطا خورد</Trans>
      </Typography>

      <Typography variant="body2" color="text.secondary">
        <Trans>
          داده‌هایت سر جاشه و پاک نشده — این خطا فقط مربوط به نمایش صفحه‌ست. دوباره امتحان کن؛ اگر باز هم تکرار شد، از تنظیمات بکاپ بگیر و
          صفحه را ببند و باز کن.
        </Trans>
      </Typography>

      <Typography
        variant="caption"
        sx={(theme) => ({
          direction: 'ltr',
          fontFamily: 'monospace',
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.surfaceContainerHigh,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          wordBreak: 'break-word',
        })}
      >
        {error instanceof Error ? error.message : String(error)}
      </Typography>

      <Button variant="contained" onClick={resetErrorBoundary}>
        <Trans>دوباره امتحان کن</Trans>
      </Button>
    </Stack>
  </Box>
)
