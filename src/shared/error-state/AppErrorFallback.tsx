import { Trans, useLingui } from '@lingui/react/macro'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { clearAllDataMutation, exportBackupMutation } from 'src/shared/queries'
import { SurfaceCard } from 'src/shared/surface-card'
import { toPersianDigits } from 'src/shared/utils'

/**
 * The crash screen, carrying its own recovery steps in the order to try them,
 * each with its own button. Telling the user to "take a backup from Settings and
 * reopen the page" is no help when the screen that broke is the one they are
 * reading it on. Erasing sits last and behind a confirmation.
 *
 * Nothing here goes through React Query, and that is deliberate throughout: the
 * boundary may have been tripped by the provider tree above this screen, so no
 * hook context can be relied on.
 */
export const AppErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const { t, i18n } = useLingui()
  // Hence reading the locale off i18n rather than through `useFormat`.
  const step = (n: number) => (i18n.locale === 'fa-IR' ? toPersianDigits(n) : String(n))
  // Enumeration letters are user-visible text: Persian lists with الف-ب.
  const [letterA, letterB] = [t`A`, t`B`]
  const [confirmErase, setConfirmErase] = useState(false)
  const [backedUp, setBackedUp] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Step A is "take a backup" and step B is "erase everything", so a failed
  // backup that leaves the button reading «دانلود» walks the user into erasing
  // data they never saved. The export does reject on corrupt rows, which is one
  // of the states this screen is reached in.
  const backup = async () => {
    setFailure(null)
    try {
      await exportBackupMutation()
      setBackedUp(true)
    } catch {
      setBackedUp(false)
      setFailure(t`The backup failed, so nothing was saved. Try again before erasing anything.`)
    }
  }

  const eraseAndRestart = async () => {
    setFailure(null)
    try {
      await clearAllDataMutation()
    } catch {
      setFailure(t`The data could not be erased. Nothing was changed.`)
      return
    }
    // Lands on Settings rather than reloading in place, because the very next
    // thing to do is import the backup taken in step A, and a hard navigation
    // is what discards whatever state broke the render. `BASE_URL` keeps this
    // correct on GitHub Pages, which serves the app from a sub-path.
    window.location.assign(`${import.meta.env.BASE_URL}settings`)
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', p: 3 }}>
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 560, width: '100%' }}>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <ErrorOutlineRoundedIcon sx={{ fontSize: 48, color: 'error.main' }} />

          <Typography variant="h2">
            <Trans>Something went wrong</Trans>
          </Typography>

          <Typography sx={{ color: 'text.secondary' }} variant="body2">
            <Trans>Your data is safe and has not been erased, this error only affects what is on screen.</Trans>
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
              // Callback at the TOP of `sx`, a function nested as a value is
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
              label={t`Download a backup, erase, and import it again`}
              description={t`Save your data to a file, wipe the app clean, then bring it back from Settings. Nothing is lost as long as you take the file first.`}
            >
              <Stack spacing={1.5} sx={{ minWidth: 210 }}>
                {/* Step B erases everything, so a failure in step A has to be
                    impossible to miss, silence here reads as success. */}
                {failure ? (
                  <Alert severity="error" sx={{ textAlign: 'start' }}>
                    {failure}
                  </Alert>
                ) : null}
                <SubStep letter={letterA} label={t`Download a backup`}>
                  <Button variant="outlined" fullWidth onClick={() => void backup()}>
                    {backedUp ? t`Downloaded` : t`Download`}
                  </Button>
                </SubStep>
                <SubStep letter={letterB} label={t`Erase and restart, then import your file from Settings`}>
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
        description={t`Every receipt, client and personal detail is erased permanently, then Settings opens so you can import your backup. Without that file there is no way back.`}
        confirmLabel={t`Erase everything`}
        confirmationWord={t`erase`}
        destructive
        onConfirm={() => void eraseAndRestart()}
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
    <Typography sx={{ color: 'text.secondary' }} variant="caption">
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
      <Typography sx={{ color: 'text.secondary' }} variant="subtitle2">
        {step}
      </Typography>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography sx={{ color: 'text.secondary' }} variant="caption">
          {description}
        </Typography>
      </Stack>
    </Stack>
    <Box sx={{ flexShrink: 0 }}>{children}</Box>
  </Stack>
)
