import { readSettings } from 'src/core/db'
import type { Settings } from 'src/shared/types'

export const settingsQueryKey = ['settings'] as const

export const getSettingsQuery = (): Promise<Settings> => readSettings()
