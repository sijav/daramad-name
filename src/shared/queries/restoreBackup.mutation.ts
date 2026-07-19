import { msg } from '@lingui/core/macro'
import { db, defaultSettings, writeSettings } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import type { BackupFile, Client, Receipt } from 'src/shared/types'

/**
 * Replaces the entire database with a backup file.
 *
 * Replace, not merge: merging would need identity rules for "the same receipt"
 * that do not exist, and would silently double someone's income if they
 * restored the same file twice — the worst possible failure for a tool whose
 * entire value is an accurate total.
 *
 * The file is validated before anything is deleted, so a malformed file leaves
 * the existing data untouched rather than destroying it.
 */
export const restoreBackupMutation = async ({ json }: { json: string }): Promise<BackupFile> => {
  const backup = parseBackup(json)

  await db.transaction('rw', db.receipts, db.clients, db.settings, async () => {
    await Promise.all([db.receipts.clear(), db.clients.clear()])
    await db.receipts.bulkAdd(backup.receipts)
    await db.clients.bulkAdd(backup.clients)
    await writeSettings(backup.settings)
  })

  return backup
}

/** Throws a human Persian error naming what is wrong, per rule 9. */
const parseBackup = (json: string): BackupFile => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(i18n._(msg`این فایل JSON معتبر نیست. مطمئن شو همون فایلی رو انتخاب کردی که از «بکاپ» گرفته بودی.`))
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(i18n._(msg`محتوای فایل خالی یا خراب است.`))
  }

  const candidate = parsed as Partial<BackupFile>

  if (candidate.app !== 'daramadname') {
    throw new Error(i18n._(msg`این فایل مال درآمدنامه نیست. فایل بکاپ یه ابزار دیگه رو انتخاب کردی؟`))
  }
  if (candidate.version !== 1) {
    throw new Error(i18n._(msg`نسخه‌ی این فایل بکاپ پشتیبانی نمی‌شه. با نسخه‌ی جدیدتر برنامه ساخته شده.`))
  }
  if (!Array.isArray(candidate.receipts) || !Array.isArray(candidate.clients)) {
    throw new Error(i18n._(msg`ساختار فایل بکاپ ناقصه؛ فهرست دریافتی‌ها یا مشتری‌ها توش نیست.`))
  }

  // Guard the fields the whole app relies on. A receipt without a stored
  // `amountToman` would quietly contribute zero to every total.
  for (const receipt of candidate.receipts as Receipt[]) {
    if (typeof receipt.id !== 'string' || typeof receipt.occurredAt !== 'string' || typeof receipt.amountToman !== 'number') {
      throw new Error(i18n._(msg`یکی از دریافتی‌های داخل فایل ناقصه و قابل بازیابی نیست.`))
    }
  }
  for (const client of candidate.clients as Client[]) {
    if (typeof client.id !== 'string' || typeof client.name !== 'string') {
      throw new Error(i18n._(msg`یکی از مشتری‌های داخل فایل ناقصه و قابل بازیابی نیست.`))
    }
  }

  return {
    app: 'daramadname',
    version: 1,
    exportedAt: candidate.exportedAt ?? new Date().toISOString(),
    receipts: candidate.receipts as Receipt[],
    clients: candidate.clients as Client[],
    settings: candidate.settings ?? defaultSettings,
  }
}
