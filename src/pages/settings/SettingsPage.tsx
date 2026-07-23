import { useLingui } from '@lingui/react/macro'
import { Alert, Box, Snackbar, Stack, TextField } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { defaultSettings } from 'src/core/db'
import { invalidateReceiptQueries, useSettings } from 'src/core/query'
import { InstallAppSection } from 'src/pwa'
import { ConfirmDialog } from 'src/shared/confirm-dialog'
import { useFormat } from 'src/shared/format'
import { PageActions, useReportYear } from 'src/shared/page-actions'
import { PageHeader } from 'src/shared/page-header'
import {
  clearAllDataMutation,
  exportBackupMutation,
  getPopulatedYearsQuery,
  getPopulatedYearsQueryKey,
  restoreBackupMutation,
  seedSampleDataMutation,
  setCalendarMutation,
  setLocaleMutation,
  setThemePreferenceMutation,
  settingsQueryKey,
  updateProfileMutation,
} from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { SettingButton, SettingRow, SettingsSection } from 'src/shared/settings-section'
import type { AppLocale, CalendarSystem, Profile, ThemePreference } from 'src/shared/types'

/**
 * Personal details, backup and restore, display preferences, privacy.
 *
 * Every destructive control on this page is behind a typed confirmation, and
 * both of them — erase, and restore-over — offer a backup first. There is no
 * server copy to fall back on, so a mis-click here is the end of the data.
 */
export const SettingsPage = () => {
  const { t } = useLingui()
  const settings = useSettings()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const { digits } = useFormat()

  // The design carries the same range pill and record button on every screen.
  // The year follows the calendar setting this page itself can change — a
  // Jalali year left selected against a Gregorian option list renders the pill
  // blank.
  const [year, setYear] = useReportYear(settings.calendar)
  const { data: years = [] } = useQuery({
    queryKey: getPopulatedYearsQueryKey(settings.calendar),
    queryFn: getPopulatedYearsQuery,
  })

  // `null` until the user edits, so the form reads straight from the saved
  // settings as they arrive from IndexedDB. Deriving rather than copying into
  // state on mount avoids a effect that would clobber typing on every refetch.
  //
  // Merged over the defaults because the settings reaching this component come
  // from the query CACHE, which is not guaranteed to have been through
  // `readSettings`: a profile written or seeded before `fullNameEn`,
  // `passportNumber` and `addressEn` existed has no such keys. Feeding
  // `undefined` to a TextField makes it uncontrolled for one paint and
  // controlled on the next — React warns, and anything typed in between is
  // dropped on the floor. Every field is a string from the first frame.
  const [draftProfile, setDraftProfile] = useState<Profile | null>(null)
  const profile: Profile = draftProfile ?? { ...defaultSettings.profile, ...settings.profile }
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
    onError: () => setError(t`Your details could not be saved. Try again.`),
  })

  const changeCalendar = useMutation({
    mutationFn: setCalendarMutation,
    onSuccess: refreshAll,
    onError: () => setError(t`That setting could not be saved. Try again.`),
  })

  const changeLocale = useMutation({
    mutationFn: setLocaleMutation,
    onSuccess: refreshAll,
    onError: () => setError(t`That setting could not be saved. Try again.`),
  })

  const changeTheme = useMutation({
    mutationFn: setThemePreferenceMutation,
    onSuccess: refreshAll,
    onError: () => setError(t`That setting could not be saved. Try again.`),
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
      // Drop the local draft: the restored file carries its own profile, and a
      // draft left pinned would show the OLD details over it and write them
      // back on the next save.
      setDraftProfile(null)
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
    onError: () => setError(t`The sample receipts could not be added.`),
  })

  const clearAll = useMutation({
    mutationFn: clearAllDataMutation,
    onSuccess: async () => {
      await refreshAll()
      // Without this the name, national ID and passport number the user just
      // erased stay on screen — and "Save details" puts them back.
      setDraftProfile(null)
      setConfirmClear(false)
      setToast(t`All data was erased.`)
    },
    onError: () => {
      setConfirmClear(false)
      setError(t`The data could not be erased. Nothing was changed.`)
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
    <Box>
      <PageHeader
        title={t`Settings`}
        subtitle={t`Data, backup and display`}
        action={<PageActions year={year} years={years} onYearChange={setYear} formatYear={digits} />}
      />

      <Stack spacing={3}>
        {/* 1 — Personal details. Not in the design's settings frame, but the
            report is unusable without it, so it follows the same row pattern.

            The row label sits beside the control rather than being a `<label>`
            bound to it, so each input carries the same text as an `aria-label`.
            Without it a screen reader announces seven unnamed text boxes in a
            row — and these are the fields that end up printed on the
            certificate, so getting the wrong one is not recoverable. */}
        <SettingsSection title={t`Personal details`}>
          <SettingRow label={t`Full name in Farsi`} description={t`Printed at the top of the income report`}>
            <TextField
              size="small"
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { 'aria-label': t`Full name in Farsi` } }}
            />
          </SettingRow>
          <SettingRow
            label={t`Full name in English`}
            description={t`Used on the English certificate — spell it exactly as your passport does`}
          >
            <TextField
              size="small"
              value={profile.fullNameEn}
              onChange={(event) => setProfile({ ...profile, fullNameEn: event.target.value })}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { dir: 'ltr', 'aria-label': t`Full name in English` } }}
            />
          </SettingRow>
          <SettingRow label={t`National ID`} description={t`Optional, shown on the report when set`}>
            <TextField
              size="small"
              value={profile.nationalId}
              onChange={(event) => setProfile({ ...profile, nationalId: event.target.value })}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { 'aria-label': t`National ID` } }}
            />
          </SettingRow>
          <SettingRow label={t`Passport number`} description={t`Optional. Worth setting if the report is for a visa application`}>
            <TextField
              size="small"
              value={profile.passportNumber}
              onChange={(event) => setProfile({ ...profile, passportNumber: event.target.value })}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { dir: 'ltr', 'aria-label': t`Passport number` } }}
            />
          </SettingRow>
          <SettingRow label={t`Phone`} description={t`Optional contact line on the report`}>
            <TextField
              size="small"
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { 'aria-label': t`Phone` } }}
            />
          </SettingRow>
          <SettingRow label={t`Address in Farsi`} description={t`Optional, printed under your name`}>
            <TextField
              size="small"
              value={profile.address}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              multiline
              minRows={2}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { 'aria-label': t`Address in Farsi` } }}
            />
          </SettingRow>
          <SettingRow
            label={t`Address in English`}
            description={t`Used on the English certificate; falls back to the Persian address when empty`}
          >
            <TextField
              size="small"
              value={profile.addressEn}
              onChange={(event) => setProfile({ ...profile, addressEn: event.target.value })}
              multiline
              minRows={2}
              sx={{ minWidth: 280 }}
              slotProps={{ htmlInput: { dir: 'ltr', 'aria-label': t`Address in English` } }}
            />
          </SettingRow>
          <SettingRow label={t`Save details`} description={t`Store these on this device`}>
            <SettingButton tone="primary" onClick={() => saveProfile.mutate(profile)} disabled={saveProfile.isPending}>
              {t`Save details`}
            </SettingButton>
          </SettingRow>
        </SettingsSection>

        {/* 2 — the design's `داده‌ها و پشتیبان‌گیری`, row for row. */}
        <SettingsSection title={t`Data and backup`}>
          <SettingRow label={t`Back up data`} description={t`Download a JSON file of every receipt`}>
            <SettingButton tone="primary" onClick={() => backup.mutate()} disabled={backup.isPending}>
              {t`Download backup`}
            </SettingButton>
          </SettingRow>
          <SettingRow label={t`Restore`} description={t`Import a backup file to bring your ledger back`}>
            <SettingButton onClick={() => fileInput.current?.click()}>{t`Choose file`}</SettingButton>
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
          </SettingRow>
          <SettingRow label={t`Sample data`} description={t`Fill the ledger with sample receipts for testing and screenshots`}>
            <SettingButton onClick={() => seed.mutate()} disabled={seed.isPending}>
              {t`Fill`}
            </SettingButton>
          </SettingRow>
          <SettingRow label={t`Erase everything`} description={t`All data is deleted permanently`}>
            <SettingButton tone="danger" onClick={() => setConfirmClear(true)}>
              {t`Erase all`}
            </SettingButton>
          </SettingRow>
        </SettingsSection>

        {/* 3 — the design's `نمایش`. Theme is the row it shows; language and
            calendar belong to the same group and keep the same pattern. */}
        <SettingsSection title={t`Display`}>
          <SettingRow label={t`App theme`} description={t`Light, dark, or follow your device`}>
            <SegmentedControl<ThemePreference>
              value={settings.themePreference}
              options={[
                { value: 'light', label: t`Light` },
                { value: 'dark', label: t`Dark` },
                { value: 'system', label: t`System` },
              ]}
              onValueChange={(themePreference) => changeTheme.mutate({ themePreference })}
            />
          </SettingRow>
          <SettingRow label={t`Language`} description={t`The whole interface switches, including text direction. Your data is untouched.`}>
            <SegmentedControl<AppLocale>
              value={settings.locale}
              options={[
                { value: 'fa-IR', label: t`Persian` },
                { value: 'en-US', label: t`English` },
              ]}
              onValueChange={(locale) => changeLocale.mutate({ locale })}
            />
          </SettingRow>
          <SettingRow
            label={t`Calendar`}
            description={t`Every date and monthly total is shown in this calendar. Your data itself does not change.`}
          >
            <SegmentedControl<CalendarSystem>
              value={settings.calendar}
              options={[
                { value: 'JALALI', label: t`Jalali` },
                { value: 'GREGORIAN', label: t`Gregorian` },
              ]}
              onValueChange={(calendar) => changeCalendar.mutate({ calendar })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Renders itself only when the browser has actually offered to install
            the app, and disappears once it is installed — so it sits here
            rather than in the design's numbered sections. */}
        <InstallAppSection />

        {/* 4 — the design's `حریم خصوصی`: a statement, no control. */}
        <SettingsSection title={t`Privacy`}>
          <SettingRow label={t`All your data stays in your own browser and is never sent anywhere.`} />
        </SettingsSection>
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
