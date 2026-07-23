import { useEffect, useState } from 'react'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { getChannel } from 'storybook/preview-api'

// Reads the Storybook "Language" toolbar from documentation, and follows it
// when it changes.
//
// The obvious `useGlobals()` throws here: preview hooks only run inside
// decorators and story functions, and documentation is neither. So the current
// toolbar language is read from the preview store on mount, then kept in sync
// through the globals channel. `GLOBALS_UPDATED` fires on every toolbar change
// (this is what makes a page follow the toggle instead of freezing on the
// language it first rendered in); `SET_GLOBALS` fires once on load. Both carry
// the full globals object.

interface PreviewWithGlobals {
  storyStore?: { userGlobals?: { get?: () => { locale?: string } | undefined } }
}

const currentLocale = (): string => {
  const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: PreviewWithGlobals }).__STORYBOOK_PREVIEW__
  return preview?.storyStore?.userGlobals?.get?.()?.locale ?? 'fa-IR'
}

/** The toolbar's language as a value. For prose, use `Localized` instead. */
export const useDocsLocale = (): string => {
  const [locale, setLocale] = useState(currentLocale)

  useEffect(() => {
    const channel = getChannel()
    if (!channel) return
    const sync = (event?: { globals?: { locale?: string } }) => {
      setLocale(event?.globals?.locale ?? currentLocale())
    }
    channel.on(GLOBALS_UPDATED, sync)
    channel.on(SET_GLOBALS, sync)
    // Re-read in case the globals settled between the first render and this effect.
    sync()
    return () => {
      channel.off(GLOBALS_UPDATED, sync)
      channel.off(SET_GLOBALS, sync)
    }
  }, [])

  return locale
}

/** Persian unless the toolbar says otherwise, the app's own default. */
export const isPersian = (locale: string): boolean => locale !== 'en-US'
