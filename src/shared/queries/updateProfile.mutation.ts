import { readSettings, writeSettings } from 'src/core/db'
import type { Profile } from 'src/shared/types'

/**
 * The report's identity block. There is no login, so this is the only source
 * for the name and national ID printed on the certificate. Without it the
 * document is anonymous, which no embassy or landlord would accept.
 */
export const updateProfileMutation = async (profile: Profile): Promise<Profile> => {
  const settings = await readSettings()
  const saved = await writeSettings({ ...settings, profile })
  return saved.profile
}
