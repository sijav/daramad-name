import { useLingui } from '@lingui/react/macro'
import { useInstallPrompt } from 'src/pwa/useInstallPrompt'
import { SettingButton, SettingRow, SettingsSection } from 'src/shared/settings-section'

/**
 * The install affordance, shaped as one more settings section.
 *
 * It renders NOTHING until the browser has actually offered installation, and
 * nothing at all once the app is installed. A permanently visible "Install"
 * button that does nothing on Firefox, on iOS, or on a second visit after the
 * app is already installed is worse than no button — this one only exists when
 * pressing it will really open the install dialog.
 */
export const InstallAppSection = () => {
  const { t } = useLingui()
  const { canInstall, promptInstall } = useInstallPrompt()

  if (!canInstall) {
    return null
  }

  return (
    <SettingsSection title={t`Installation`}>
      <SettingRow label={t`Install this app`} description={t`It opens in its own window and keeps working without a connection.`}>
        <SettingButton tone="primary" onClick={() => void promptInstall()}>
          {t`Install`}
        </SettingButton>
      </SettingRow>
    </SettingsSection>
  )
}
