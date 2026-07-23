import { readSettings, writeSettings } from 'src/core/db'
import type { Profile } from 'src/shared/types'

/**
 * The report's identity block. There is no login, so this is the only source
 * for the name and national ID printed on the income certificate, without it
 * scenario 3 produces an anonymous document nobody would accept.
 */
export const updateProfileMutation = async (profile: Profile): Promise<Profile> => {
  const settings = await readSettings()
  const saved = await writeSettings({ ...settings, profile })
  return saved.profile
}
