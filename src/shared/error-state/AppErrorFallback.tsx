import { Trans, useLingui } from '@lingui/react/macro'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { clearAllDataMutation, exportBackupMutation } from 'src/shared/queries'

/**
 * Rule 9: no «خطایی رخ داد». Say what happened and what to do about it.
 *
 * The technical message is shown too — this is a tool holding someone's
 * financial history, and hiding the cause of a failure would leave them unable
 * to tell a transient glitch from real data loss.
 */
export const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const { t } = useLingui()
  const [confirmErase, setConfirmErase] = useState(false)
  const [backedUp, setBackedUp] = useState(false)

  // Deliberately called directly rather than through React Query: the error
  // boundary may have been tripped by the provider tree itself, so this screen
  // cannot assume any hook context above it still works.
  const backup = async () => {
    await exportBackupMutation()
    setBackedUp(true)
  }

  const eraseAndReload = async () => {
    await clearAllDataMutation()
    window.location.reload()
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 460 }}>
        <ErrorOutlineRoundedIcon sx={{ fontSize: 48, color: 'error.main' }} />

        <Typography variant="h2">
          <Trans>Something went wrong</Trans>
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <Trans>
            Your data is safe and has not been erased — this error only affects rendering. Try again first. If it keeps happening, download
            a backup here, and only then erase and start fresh.
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

        {/* Each recovery step is its own button, in the order they should be
          tried. Telling someone to "back up from Settings" is useless advice
          when the screen they are on is the one that broke. */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="contained" onClick={resetErrorBoundary}>
            <Trans>Try again</Trans>
          </Button>
          <Button variant="outlined" onClick={() => void backup()}>
            {backedUp ? t`Backup downloaded` : t`Download a backup`}
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            <Trans>Reload the page</Trans>
          </Button>
          <Button variant="outlined" color="error" onClick={() => setConfirmErase(true)}>
            <Trans>Erase data and restart</Trans>
          </Button>
        </Stack>

        <ConfirmDialog
          open={confirmErase}
          title={t`Erase data and restart`}
          description={t`Every receipt, client and personal detail is erased permanently, then the page reloads. Download a backup first — without one there is no way back.`}
          confirmLabel={t`Erase everything`}
          confirmationWord={t`erase`}
          destructive
          onConfirm={() => void eraseAndReload()}
          onClose={() => setConfirmErase(false)}
        />
      </Stack>
    </Box>
  )
}
