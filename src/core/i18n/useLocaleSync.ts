import { useEffect, useState } from 'react'
import { useSettings } from 'src/core/query'
import { activateLocale, i18n } from './i18n'

/**
 * Keeps the active catalog in step with the persisted Settings locale.
 *
 * Loading a catalog is async (the compiled messages are a dynamic import), so
 * this is a genuine external-system synchronisation — the one thing effects are
 * actually for. `ready` gates the first render so no component paints with
 * English message ids before the Persian catalog lands.
 */
export const useLocaleSync = (): boolean => {
  const { locale } = useSettings()
  const [ready, setReady] = useState(() => i18n.locale === locale)

  useEffect(() => {
    let cancelled = false
    void activateLocale(locale).then(() => {
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
