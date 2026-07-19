import { Trans, useLingui } from '@lingui/react/macro'
import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { invalidateReceiptQueries, useSettings } from 'src/core/query'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { GlassCard } from 'src/shared/glass-card'
import { PageHeader } from 'src/shared/page-header'
import {
  clearAllDataMutation,
  exportBackupMutation,
  restoreBackupMutation,
  seedSampleDataMutation,
  setCalendarMutation,
  setLocaleMutation,
  settingsQueryKey,
  updateProfileMutation,
} from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import type { AppLocale, CalendarSystem, Profile } from 'src/shared/types'

export const SettingsPage = () => {
  const { t } = useLingui()
  const settings = useSettings()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)

  // `null` until the user edits, so the form reads straight from the saved
  // settings as they arrive from IndexedDB. Deriving rather than copying into
  // state on mount avoids a effect that would clobber typing on every refetch.
  const [draftProfile, setDraftProfile] = useState<Profile | null>(null)
  const profile = draftProfile ?? settings.profile
  const setProfile = setDraftProfile

  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<string | null>(null)

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    await invalidateReceiptQueries()
  }

  const saveProfile = useMutation({
    mutationFn: updateProfileMutation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      setToast(t`Your details were saved.`)
    },
  })

  const changeCalendar = useMutation({
    mutationFn: setCalendarMutation,
    onSuccess: refreshAll,
  })

  const changeLocale = useMutation({
    mutationFn: setLocaleMutation,
    onSuccess: refreshAll,
  })

  const backup = useMutation({
    mutationFn: exportBackupMutation,
    onSuccess: () => setToast(t`Backup file downloaded.`),
    onError: () => setError(t`The backup failed. Try again.`),
  })

  const restore = useMutation({
    mutationFn: restoreBackupMutation,
    onSuccess: async (data) => {
      await refreshAll()
      setPendingRestore(null)
      setToast(t`${data.receipts.length} receipts restored.`)
    },
    onError: (cause: Error) => {
      setPendingRestore(null)
      setError(cause.message)
    },
  })

  const seed = useMutation({
    mutationFn: seedSampleDataMutation,
    onSuccess: async (count) => {
      await invalidateReceiptQueries()
      setToast(t`${count} sample receipts added.`)
    },
  })

  const clearAll = useMutation({
    mutationFn: clearAllDataMutation,
    onSuccess: async () => {
      await refreshAll()
      setConfirmClear(false)
      setToast(t`All data was erased.`)
    },
  })

  const onFilePicked = async (file: File | undefined) => {
    if (!file) {
      return
    }
    try {
      setPendingRestore(await file.text())
    } catch {
      setError(t`The file could not be read. Make sure it is intact and pick it again.`)
    }
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <PageHeader title={t`Settings`} />

      <Stack spacing={3}>
        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>Personal details</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>
              These details are printed at the top of the income report. Without a name the document carries no weight with an embassy or a
              landlord.
            </Trans>
          </Typography>

          <Stack spacing={2}>
            <TextField
              label={t`Full name`}
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`National ID`}
              value={profile.nationalId}
              onChange={(event) => setProfile({ ...profile, nationalId: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`Phone`}
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`Address`}
              value={profile.address}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              multiline
              minRows={2}
              fullWidth
            />
            <Button variant="contained" onClick={() => saveProfile.mutate(profile)} disabled={saveProfile.isPending}>
              <Trans>Save details</Trans>
            </Button>
          </Stack>
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>Language</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <Trans>The whole interface switches, including text direction. Your data is untouched.</Trans>
          </Typography>
          <SegmentedControl<AppLocale>
            value={settings.locale}
            options={[
              { value: 'fa-IR', label: t`Persian` },
              { value: 'en-US', label: t`English` },
            ]}
            onValueChange={(locale) => changeLocale.mutate({ locale })}
          />
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>Calendar</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <Trans>Every date and monthly total is shown in this calendar. Your data itself does not change.</Trans>
          </Typography>
          <SegmentedControl<CalendarSystem>
            value={settings.calendar}
            options={[
              { value: 'JALALI', label: t`Jalali` },
              { value: 'GREGORIAN', label: t`Gregorian` },
            ]}
            onValueChange={(calendar) => changeCalendar.mutate({ calendar })}
          />
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>Backup and restore</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>Your data lives only in this browser. If you clear the browser, everything is lost without a backup.</Trans>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" onClick={() => backup.mutate()} disabled={backup.isPending}>
              <Trans>Back up (download JSON)</Trans>
            </Button>
            <Button variant="outlined" onClick={() => fileInput.current?.click()}>
              <Trans>Restore from file</Trans>
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                void onFilePicked(event.target.files?.[0])
                // Reset so picking the same file twice still fires a change.
                event.target.value = ''
              }}
            />
          </Stack>
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>Sample data and reset</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>Sample data is for testing and screenshots. For a real demo, record your own data.</Trans>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => seed.mutate()} disabled={seed.isPending}>
              <Trans>Add sample data</Trans>
            </Button>
            <Button variant="outlined" color="error" onClick={() => setConfirmClear(true)}>
              <Trans>Erase all data</Trans>
            </Button>
          </Stack>
        </GlassCard>
      </Stack>

      <ConfirmDialog
        open={confirmClear}
        title={t`Erase all data`}
        description={t`Every receipt, client and personal detail is erased permanently. Without a backup there is no way back.`}
        confirmLabel={t`Erase everything`}
        confirmationWord={t`erase`}
        destructive
        onConfirm={() => clearAll.mutate()}
        onClose={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={pendingRestore !== null}
        title={t`Restore from file`}
        description={t`Your current data is replaced entirely by the contents of this file. If you have receipts recorded now, back them up first.`}
        confirmLabel={t`Restore`}
        destructive
        onConfirm={() => pendingRestore && restore.mutate({ json: pendingRestore })}
        onClose={() => setPendingRestore(null)}
      />

      <Snackbar open={toast !== null} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>

      <Snackbar open={error !== null} autoHideDuration={8000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
