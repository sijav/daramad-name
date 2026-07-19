import { useQuery } from '@tanstack/react-query'
import { defaultSettings } from 'src/core/db'
import { getSettingsQuery, settingsQueryKey } from 'src/shared/queries'
import type { Settings } from 'src/shared/types'

/**
 * Settings are read by almost every component (the calendar choice drives every
 * date on screen), so this is the one place a hook wraps a query rather than
 * callers repeating the key. Falls back to defaults while loading so no
 * component has to render a spinner just to format a date.
 */
export const useSettings = (): Settings => {
  const { data } = useQuery({ queryKey: settingsQueryKey, queryFn: getSettingsQuery })
  return data ?? defaultSettings
}
