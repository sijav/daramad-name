import { Trans, useLingui } from '@lingui/react/macro'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { clearAllDataMutation, exportBackupMutation } from 'src/shared/queries'
import { SurfaceCard } from 'src/shared/surface-card'
import { toPersianDigits } from 'src/shared/utils'

/**
 * Rule 9: no «خطایی رخ داد». Say what happened and what to do about it.
 *
 * The recovery steps are laid out in the order they should be tried, each with
 * its own explanation and its own button, because "take a backup from Settings
 * and reopen the page" is useless advice when the screen that broke is the one
 * you are reading it on. Erasing sits last and behind a confirmation.
 */
export const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const { t, i18n } = useLingui()
  // Not `useFormat`: that reads settings through React Query, and the boundary
  // may have been tripped by the provider tree above this screen.
  const step = (n: number) => (i18n.locale === 'fa-IR' ? toPersianDigits(n) : String(n))
  // Enumeration letters are user-visible text: Persian lists with الف-ب.
  const letters = [t`A`, t`B`]
  const letter = (index: number) => letters[index]
  const [confirmErase, setConfirmErase] = useState(false)
  const [backedUp, setBackedUp] = useState(false)

  // Called directly rather than through React Query: the boundary may have been
  // tripped by the provider tree itself, so no hook context above can be relied on.
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
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 560, width: '100%' }}>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <ErrorOutlineRoundedIcon sx={{ fontSize: 48, color: 'error.main' }} />

          <Typography variant="h2">
            <Trans>Something went wrong</Trans>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            <Trans>Your data is safe and has not been erased — this error only affects what is on screen.</Trans>
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
        </Stack>

        <SurfaceCard radius="lg" flat disablePadding sx={{ width: '100%' }}>
          <Stack
            sx={(theme) => ({
              // Callback at the TOP of `sx` — a function nested as a value is
              // never resolved.
              '& > :not(:last-of-type)': { borderBottom: `1px solid ${theme.palette.borderDefault}` },
            })}
          >
            <RecoveryStep step={step(1)} label={t`Try rendering the page again`} description={t`Nothing is changed or reloaded.`}>
              <Button variant="contained" onClick={resetErrorBoundary}>
                {t`Try again`}
              </Button>
            </RecoveryStep>

            <RecoveryStep step={step(2)} label={t`Reload the page`} description={t`Starts the app fresh. Your data stays where it is.`}>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                {t`Reload`}
              </Button>
            </RecoveryStep>

            {/* The last resort is a PAIR, in order: take the backup, then
                erase. Lettered so that order is explicit rather than implied
                by two rows that look independent. */}
            <RecoveryStep
              step={step(3)}
              label={t`If it still fails, start over`}
              description={t`Take the backup first — erasing cannot be undone without it.`}
            >
              <Stack spacing={1.5} sx={{ minWidth: 210 }}>
                <SubStep letter={letter(0)} label={t`Download a backup`}>
                  <Button variant="outlined" fullWidth onClick={() => void backup()}>
                    {backedUp ? t`Downloaded` : t`Download`}
                  </Button>
                </SubStep>
                <SubStep letter={letter(1)} label={t`Erase and restart`}>
                  <Button variant="outlined" color="error" fullWidth onClick={() => setConfirmErase(true)}>
                    {t`Erase and restart`}
                  </Button>
                </SubStep>
              </Stack>
            </RecoveryStep>
          </Stack>
        </SurfaceCard>
      </Stack>

      <ConfirmDialog
        open={confirmErase}
        title={t`Erase everything and restart`}
        description={t`Every receipt, client and personal detail is erased permanently, then the page reloads. Without a backup there is no way back.`}
        confirmLabel={t`Erase everything`}
        confirmationWord={t`erase`}
        destructive
        onConfirm={() => void eraseAndReload()}
        onClose={() => setConfirmErase(false)}
      />
    </Box>
  )
}

interface RecoveryStepProps {
  step: string
  label: string
  description: string
  children: ReactNode
}

/** A lettered option inside a step: its label, then its control. */
const SubStep = ({ letter, label, children }: { letter: string; label: string; children: ReactNode }) => (
  <Stack spacing={0.75} sx={{ textAlign: 'start' }}>
    <Typography variant="caption" color="text.secondary">
      {`${letter}. ${label}`}
    </Typography>
    {children}
  </Stack>
)

/** One numbered option: explanation on the reading side, its button opposite. */
const RecoveryStep = ({ step, label, description, children }: RecoveryStepProps) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    // `spacing` alone leaves no gap once the row wraps to a column, which is
    // what made the stacked buttons collide.
    spacing={2}
    useFlexGap
    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', px: 2, py: 1.75 }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', minWidth: 0, textAlign: 'start' }}>
      <Typography variant="subtitle2" color="text.secondary">
        {step}
      </Typography>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Stack>
    <Box sx={{ flexShrink: 0 }}>{children}</Box>
  </Stack>
)
