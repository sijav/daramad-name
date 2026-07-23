import { useEffect, useState } from 'react'
import { useSettings } from 'src/core/query'
import { activateLocale, i18n } from './i18n'

/**
 * Keeps the active catalog in step with the persisted Settings locale.
 *
 * Loading a catalog is async, so this is a real external-system
 * synchronisation rather than derived state. `ready` gates the first render, so
 * nothing paints English message ids while the Persian catalog is still in
 * flight.
 */
export const useLocaleSync = (): boolean => {
  const { locale } = useSettings()
  const [ready, setReady] = useState(() => i18n.locale === locale)

  useEffect(() => {
    let cancelled = false
    // The gate opens whether or not the catalog loads. A dropped connection or
    // a chunk stale after a deploy rejects the import, and gating on success
    // alone left the app on its spinner with nothing to press. Falling through
    // renders the previously active catalog, or the English message ids on a
    // cold start; both are usable and a reload fixes them.
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
