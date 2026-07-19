import { readSettings, writeSettings } from 'src/core/db'
import type { Settings, ThemePreference } from 'src/shared/types'

export const setThemePreferenceMutation = async ({ themePreference }: { themePreference: ThemePreference }): Promise<Settings> => {
  const settings = await readSettings()
  return writeSettings({ ...settings, themePreference })
}
