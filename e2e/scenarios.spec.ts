import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

// End-to-end checks of the six founding scenarios. Each test performs the
// scenario in the real app and then asserts its «نتیجه موفق» (successful result)
// against the ground truth in IndexedDB, so a green run means the outcome held,
// not merely that the buttons were clickable. The sample data is random, so the
// expected figures are computed from the database rather than hardcoded.

interface Receipt {
  id: string
  occurredAt: string
  amountOriginal: number
  currency: string
  rate: number | null
  amountToman: number
  clientId: string | null
  channel: string
  note: string
}
interface Client {
  id: string
  name: string
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
const numOf = (s: string) => Number(toLatin(s).replace(/[^\d]/g, ''))

const jalaliParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(
    new Date(iso),
  )
  const pick = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  return { year: pick('year'), month: pick('month'), day: pick('day') }
}

const readDb = (page: Page) =>
  page.evaluate(async () => {
    const open = indexedDB.open('daramadname')
    const db = await new Promise<IDBDatabase>((res, rej) => {
      open.onsuccess = () => res(open.result)
      open.onerror = () => rej(open.error)
    })
    const all = (store: string) =>
      new Promise<unknown[]>((res, rej) => {
        const req = db.transaction(store, 'readonly').objectStore(store).getAll()
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
      })
    return { receipts: (await all('receipts')) as unknown, clients: (await all('clients')) as unknown }
  }) as Promise<{ receipts: Receipt[]; clients: Client[] }>

const sum = (receipts: Receipt[]) => receipts.reduce((total, r) => total + r.amountToman, 0)

// Fill the ledger with sample data through the app's own button, and set a name
// so the certificate is complete. A fresh test context starts with an empty
// database, so Fill seeds straight away.
const seed = async (page: Page) => {
  await page.goto('/settings')
  await page.getByRole('textbox', { name: 'نام و نام خانوادگی', exact: true }).fill('سینا جواهری')
  await page.getByRole('textbox', { name: 'نام و نام خانوادگی به انگلیسی', exact: true }).fill('Sina Javaheri')
  await page.getByRole('button', { name: 'ذخیره مشخصات' }).click()
  await page.getByRole('button', { name: 'پر کردن' }).click()
  const confirm = page.getByRole('textbox', { name: /پاک کن/ })
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.fill('پاک کن')
    await page.getByRole('button', { name: 'پاک کن و پر کن' }).click()
  }
  await expect.poll(async () => (await readDb(page)).receipts.length, { timeout: 15_000 }).toBeGreaterThan(20)
}

// Record a foreign-currency receipt through the quick-entry form.
const recordForeign = async (page: Page, amount: string, rate: string, client: string) => {
  await page.goto('/quick-entry')
  await page.getByRole('button', { name: 'تتر', exact: true }).click()
  await page.locator('label:has-text("مبلغ دریافتی") input').first().fill(amount)
  await page.locator('label:has-text("نرخ") input').first().fill(rate)
  await page.getByPlaceholder('اسم مشتری را بنویس یا انتخاب کن').fill(client)
  await page.getByRole('radio', { name: 'تتر' }).click()
  await page.getByRole('button', { name: 'ثبت دریافتی' }).click()
}

test.describe('the six founding scenarios', () => {
  test('S1: a foreign receipt freezes its Toman value, client and channel at entry', async ({ page }) => {
    await page.goto('/quick-entry')

    // Enter 500 Tether at 96,000: the equivalent is computed and shown as frozen.
    await page.getByRole('button', { name: 'تتر', exact: true }).click()
    await page.locator('label:has-text("مبلغ دریافتی") input').first().fill('500')
    await page.locator('label:has-text("نرخ") input').first().fill('96000')
    await page.getByPlaceholder('اسم مشتری را بنویس یا انتخاب کن').fill('استودیو نقش')
    await page.getByRole('radio', { name: 'تتر' }).click()
    // «فریز‌شده» carries a zero-width non-joiner, so match around it.
    await expect(page.getByText(/فریز.?شده/)).toBeVisible()
    await page.getByRole('button', { name: 'ثبت دریافتی' }).click()
    await expect.poll(async () => (await readDb(page)).receipts.length).toBe(1)

    // A second receipt at a DIFFERENT rate must not restate the first one.
    await recordForeign(page, '500', '120000', 'کویر تک')
    await expect.poll(async () => (await readDb(page)).receipts.length).toBe(2)

    const { receipts, clients } = await readDb(page)
    const first = receipts.find((r) => r.rate === 96000)!
    const second = receipts.find((r) => r.rate === 120000)!

    // The Toman value was computed once, at entry, and stored on the row.
    expect(first.amountToman).toBe(500 * 96000)
    expect(first.currency).toBe('USDT')
    expect(first.channel).toBe('TETHER')
    expect(clients.find((c) => c.id === first.clientId)?.name).toBe('استودیو نقش')

    // The later receipt at a higher rate is frozen at its own value, and the
    // first one is untouched: a Tether price move never rewrites history.
    expect(second.amountToman).toBe(500 * 120000)
    expect(first.amountToman).toBe(500 * 96000)
  })

  test('S2: filtering by a client shows that client’s exact total', async ({ page }) => {
    await seed(page)
    const { receipts, clients } = await readDb(page)

    // The busiest client is the retainer; compute its true total from the data.
    const countById = new Map<string, number>()
    for (const r of receipts) if (r.clientId) countById.set(r.clientId, (countById.get(r.clientId) ?? 0) + 1)
    const topId = [...countById.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const topName = clients.find((c) => c.id === topId)!.name
    const clientReceipts = receipts.filter((r) => r.clientId === topId)
    const expectedTotal = sum(clientReceipts)
    const expectedCount = clientReceipts.length

    await page.goto('/ledger')
    await page.getByRole('button', { name: 'فیلترها' }).click()
    const clientBox = page.getByPlaceholder('همه‌ی مشتری‌ها')
    await clientBox.click()
    await clientBox.fill(topName)
    await clientBox.press('ArrowDown')
    await clientBox.press('Enter')
    await page.getByRole('button', { name: 'اعمال فیلترها' }).click()

    // The filter is on, and the ledger reports this client's exact figures.
    await expect(page.getByText(`مشتری: ${topName}`)).toBeVisible()
    await expect.poll(async () => numOf(await page.getByRole('heading', { name: /نتیجه/ }).innerText())).toBe(expectedCount)
    // «جمع کل» appears both on the summary card and the table footer; the card
    // label is an exact match, the footer («جمع کل ۴۲ دریافتی…») is not. Climb to
    // the nearest ancestor that actually holds the «تومان» value.
    const totalCard = page.getByText('جمع کل', { exact: true }).locator('xpath=ancestor::*[contains(., "تومان")][1]')
    expect(numOf(await totalCard.innerText())).toBe(expectedTotal)
  })

  test('S3: the report totals the year exactly and prints a bilingual PDF', async ({ page }) => {
    await seed(page)
    const { receipts } = await readDb(page)
    const thisYear = jalaliParts(new Date().toISOString()).year
    const yearReceipts = receipts.filter((r) => jalaliParts(r.occurredAt).year === thisYear)
    const expectedTotal = sum(yearReceipts)

    await page.goto('/report')
    // Total on the document equals the sum of this year's receipts.
    const totalText = await page.getByText('جمع کل درآمد').locator('..').innerText()
    expect(numOf(totalText)).toBe(expectedTotal)

    // Switching to English yields an official, named certificate.
    await page.getByRole('button', { name: 'انگلیسی', exact: true }).click()
    await expect(page.getByText('Statement of Income')).toBeVisible()
    await expect(page.getByText('Sina Javaheri')).toBeVisible()
    await expect(page.getByText('Month-by-month breakdown')).toBeVisible()

    // The download produces a real PDF file.
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /PDF|دانلود/ }).click(),
    ]).then(([dl]) => dl)
    const pdfPath = await download.path()
    expect(readFileSync(pdfPath).subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('S4: the chart keeps empty months and the insight names the true share', async ({ page }) => {
    await seed(page)
    const { receipts } = await readDb(page)
    const thisYear = jalaliParts(new Date().toISOString()).year
    const yearReceipts = receipts.filter((r) => jalaliParts(r.occurredAt).year === thisYear)
    const byClient = new Map<string, number>()
    for (const r of yearReceipts) if (r.clientId) byClient.set(r.clientId, (byClient.get(r.clientId) ?? 0) + r.amountToman)
    const topToman = Math.max(...byClient.values())
    const expectedShare = Math.round((topToman / sum(yearReceipts)) * 100)

    await page.goto('/charts')
    // Twelve month columns, with at least one empty month drawn as zero rather
    // than dropped from the axis.
    const months = page.getByRole('img', { name: /:/ })
    await expect(months).toHaveCount(12)
    await expect(page.getByRole('img', { name: /بدون درآمد ثبت‌شده/ }).first()).toBeVisible()

    // The concentration insight fires and states the real top-client percentage.
    const insight = page.getByText(/درآمدت از یک مشتری است/)
    await expect(insight).toBeVisible()
    expect(numOf(await insight.innerText())).toBe(expectedShare)
  })

  test('S5: a backdated receipt lands in the right month and lifts that month’s total', async ({ page }) => {
    await seed(page)

    // The form's month segment steps in Jalali, so target two Jalali months back.
    const targetKey = (iso: string) => {
      const j = jalaliParts(iso)
      return `${j.year}-${j.month}`
    }
    const jNow = jalaliParts(new Date().toISOString())
    let targetYear = jNow.year
    let targetMonth = jNow.month - 2
    if (targetMonth < 1) {
      targetMonth += 12
      targetYear -= 1
    }
    const wantKey = `${targetYear}-${targetMonth}`
    const before = sum((await readDb(page)).receipts.filter((r) => targetKey(r.occurredAt) === wantKey))

    await page.goto('/quick-entry')
    const monthSeg = page.getByRole('spinbutton', { name: 'ماه' }).first()
    await monthSeg.click()
    await monthSeg.press('ArrowDown')
    await monthSeg.press('ArrowDown')
    await page.locator('label:has-text("مبلغ دریافتی") input').first().fill('12000000')
    await page.getByPlaceholder('اسم مشتری را بنویس یا انتخاب کن').fill('کویر تک')
    await page.getByRole('button', { name: 'ثبت دریافتی' }).click()

    // The new receipt sits in the target month, and that month's total rose by
    // exactly its amount — the aggregates corrected themselves.
    await expect
      .poll(async () => sum((await readDb(page)).receipts.filter((r) => targetKey(r.occurredAt) === wantKey)))
      .toBe(before + 12_000_000)
    const after = (await readDb(page)).receipts.filter((r) => targetKey(r.occurredAt) === wantKey)
    expect(after.some((r) => r.amountToman === 12_000_000 && r.currency === 'TOMAN')).toBe(true)
  })

  test('S6: backup then restore round-trips every receipt exactly', async ({ page }) => {
    await seed(page)
    const original = await readDb(page)
    const fingerprint = (rs: Receipt[]) =>
      rs
        .map((r) => `${r.amountToman}|${r.currency}|${r.rate}|${r.occurredAt.slice(0, 10)}|${r.channel}`)
        .sort()
        .join(';')
    const originalPrint = fingerprint(original.receipts)

    // Download the backup and confirm it carries the full detail.
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'دانلود بکاپ' }).click(),
    ]).then(([dl]) => dl)
    const backupPath = await download.path()
    const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
    expect(backup.receipts.length).toBe(original.receipts.length)
    expect(backup.receipts[0]).toMatchObject({
      amountToman: expect.any(Number),
      currency: expect.any(String),
      occurredAt: expect.any(String),
      channel: expect.any(String),
    })

    // Erase everything.
    await page.getByRole('button', { name: 'پاک کردن همه' }).click()
    const eraseWord = page.getByRole('textbox', { name: /پاک کن/ })
    await eraseWord.fill('پاک کن')
    await page.getByRole('button', { name: 'همه را پاک کن' }).click()
    await expect.poll(async () => (await readDb(page)).receipts.length).toBe(0)

    // Restore from the file, and the ledger comes back exactly as it was.
    await page.locator('input[type="file"]').setInputFiles(backupPath)
    await page.getByRole('button', { name: 'بازیابی کن' }).click()
    await expect.poll(async () => (await readDb(page)).receipts.length).toBe(original.receipts.length)
    const restored = await readDb(page)
    expect(fingerprint(restored.receipts)).toBe(originalPrint)
  })
})
