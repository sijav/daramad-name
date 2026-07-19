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
  settingsQueryKey,
  updateProfileMutation,
} from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import type { CalendarSystem, Profile } from 'src/shared/types'

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
      setToast(t`مشخصاتت ذخیره شد.`)
    },
  })

  const changeCalendar = useMutation({
    mutationFn: setCalendarMutation,
    onSuccess: refreshAll,
  })

  const backup = useMutation({
    mutationFn: exportBackupMutation,
    onSuccess: () => setToast(t`فایل بکاپ دانلود شد.`),
    onError: () => setError(t`گرفتن بکاپ ناموفق بود. دوباره امتحان کن.`),
  })

  const restore = useMutation({
    mutationFn: restoreBackupMutation,
    onSuccess: async (data) => {
      await refreshAll()
      setPendingRestore(null)
      setToast(t`${data.receipts.length} دریافتی بازیابی شد.`)
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
      setToast(t`${count} دریافتی نمونه اضافه شد.`)
    },
  })

  const clearAll = useMutation({
    mutationFn: clearAllDataMutation,
    onSuccess: async () => {
      await refreshAll()
      setConfirmClear(false)
      setToast(t`همه‌ی داده‌ها پاک شد.`)
    },
  })

  const onFilePicked = async (file: File | undefined) => {
    if (!file) {
      return
    }
    try {
      setPendingRestore(await file.text())
    } catch {
      setError(t`فایل خوانده نشد. مطمئن شو فایل سالمه و دوباره انتخابش کن.`)
    }
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <PageHeader title={t`تنظیمات`} />

      <Stack spacing={3}>
        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>مشخصات فردی</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>این اطلاعات بالای گزارش درآمد چاپ می‌شه. بدون اسم، سند برای سفارت یا صاحبخونه اعتباری نداره.</Trans>
          </Typography>

          <Stack spacing={2}>
            <TextField
              label={t`نام و نام خانوادگی`}
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`کد ملی`}
              value={profile.nationalId}
              onChange={(event) => setProfile({ ...profile, nationalId: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`تلفن`}
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              fullWidth
            />
            <TextField
              label={t`نشانی`}
              value={profile.address}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              multiline
              minRows={2}
              fullWidth
            />
            <Button variant="contained" onClick={() => saveProfile.mutate(profile)} disabled={saveProfile.isPending}>
              <Trans>ذخیره مشخصات</Trans>
            </Button>
          </Stack>
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>تقویم</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <Trans>همه‌ی تاریخ‌ها و جمع‌بندی‌های ماهانه با این تقویم نمایش داده می‌شن. داده‌هایت تغییری نمی‌کنن.</Trans>
          </Typography>
          <SegmentedControl<CalendarSystem>
            value={settings.calendar}
            options={[
              { value: 'JALALI', label: t`شمسی` },
              { value: 'GREGORIAN', label: t`میلادی` },
            ]}
            onValueChange={(calendar) => changeCalendar.mutate({ calendar })}
          />
        </GlassCard>

        <GlassCard>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            <Trans>بکاپ و بازیابی</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>داده‌هایت فقط روی همین مرورگره. اگر مرورگر رو پاک کنی، بدون بکاپ همه‌چیز از دست می‌ره.</Trans>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" onClick={() => backup.mutate()} disabled={backup.isPending}>
              <Trans>بکاپ (دانلود JSON)</Trans>
            </Button>
            <Button variant="outlined" onClick={() => fileInput.current?.click()}>
              <Trans>بازیابی از فایل</Trans>
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
            <Trans>داده‌ی نمونه و پاک‌سازی</Trans>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Trans>داده‌ی نمونه برای تست و اسکرین‌شاته. برای دموی واقعی، دیتای خودت رو ثبت کن.</Trans>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => seed.mutate()} disabled={seed.isPending}>
              <Trans>افزودن داده‌ی نمونه</Trans>
            </Button>
            <Button variant="outlined" color="error" onClick={() => setConfirmClear(true)}>
              <Trans>پاک کردن همه‌ی داده‌ها</Trans>
            </Button>
          </Stack>
        </GlassCard>
      </Stack>

      <ConfirmDialog
        open={confirmClear}
        title={t`پاک کردن همه‌ی داده‌ها`}
        description={t`همه‌ی دریافتی‌ها، مشتری‌ها و مشخصاتت برای همیشه پاک می‌شن. اگر بکاپ نگرفتی، برگشتی وجود نداره.`}
        confirmLabel={t`همه را پاک کن`}
        confirmationWord={t`پاک کن`}
        destructive
        onConfirm={() => clearAll.mutate()}
        onClose={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={pendingRestore !== null}
        title={t`بازیابی از فایل`}
        description={t`داده‌های فعلی کاملاً با محتوای این فایل جایگزین می‌شن. اگر الان دریافتی ثبت‌شده داری، اول ازش بکاپ بگیر.`}
        confirmLabel={t`بازیابی کن`}
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
