import { db, readSettings } from 'src/core/db'
import type { BackupFile } from 'src/shared/types'

/**
 * Serialises the entire database to a JSON file and downloads it.
 *
 * This is the only way data leaves the app, and it is user-initiated. It is
 * also the substitute for a server: scenario 6's "restore on another device"
 * is this file, carried by the user.
 */
export const exportBackupMutation = async (): Promise<BackupFile> => {
  const [receipts, clients, settings] = await Promise.all([db.receipts.toArray(), db.clients.toArray(), readSettings()])

  const backup: BackupFile = {
    app: 'daramadname',
    version: 1,
    exportedAt: new Date().toISOString(),
    receipts,
    clients,
    settings,
  }

  const blob = new window.Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `daramadname-backup-${backup.exportedAt.slice(0, 10)}.json`
  anchor.click()
  window.URL.revokeObjectURL(url)

  return backup
}
