import { readSettings, writeSettings } from 'src/core/db'
import type { CalendarSystem, Settings } from 'src/shared/types'

export const setCalendarMutation = async ({ calendar }: { calendar: CalendarSystem }): Promise<Settings> => {
  const settings = await readSettings()
  return writeSettings({ ...settings, calendar })
}
