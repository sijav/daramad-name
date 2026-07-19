import { readSettings, writeSettings } from 'src/core/db'
import type { AppLocale, Settings } from 'src/shared/types'

export const setLocaleMutation = async ({ locale }: { locale: AppLocale }): Promise<Settings> => {
  const settings = await readSettings()
  return writeSettings({ ...settings, locale })
}
