import { useEffect, useState } from 'react'
import { useSettings } from 'src/core/query'
import { activateLocale, i18n } from './i18n'

/**
 * Keeps the active catalog in step with the persisted Settings locale.
 *
 * Loading a catalog is async (the compiled messages are a dynamic import), so
 * this is a genuine external-system synchronisation, the one thing effects are
 * actually for. `ready` gates the first render so no component paints with
 * English message ids before the Persian catalog lands.
 */
export const useLocaleSync = (): boolean => {
  const { locale } = useSettings()
  const [ready, setReady] = useState(() => i18n.locale === locale)

  useEffect(() => {
    let cancelled = false
    // Open the gate even when the catalog fails to load.
    //
    // The messages are a dynamic import, so a dropped connection or a stale
    // chunk after a deploy rejects it. Gating render on success alone left the
    // whole app on a spinner forever, with nothing shown and nothing to press
    // the one failure a user cannot act on. Rendering in whatever catalog is
    // already active degrades to the previous language, or to the English
    // message ids on a cold start, both of which are usable and recoverable by
    // a reload.
    void activateLocale(locale)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  return ready
}
