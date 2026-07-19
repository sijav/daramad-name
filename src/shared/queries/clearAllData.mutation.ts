import { db, defaultSettings, writeSettings } from 'src/core/db'

/**
 * Wipes everything. The two-step confirmation lives in the UI, not here —
 * this function assumes the caller already got a deliberate yes.
 */
export const clearAllDataMutation = async (): Promise<boolean> => {
  await db.transaction('rw', db.receipts, db.clients, db.settings, async () => {
    await Promise.all([db.receipts.clear(), db.clients.clear()])
    await writeSettings(defaultSettings)
  })
  return true
}
