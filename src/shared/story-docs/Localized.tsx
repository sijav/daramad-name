import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { getChannel } from 'storybook/preview-api'

// Picks one of two language versions of documentation prose from the Storybook
// "Language" toolbar, and — crucially — follows it when it changes.
//
// The obvious `useGlobals()` throws here: preview hooks only run inside
// decorators and story functions, and MDX prose is neither. So the current
// toolbar language is read from the preview store on mount, then kept in sync
// through the globals channel. `GLOBALS_UPDATED` fires on every toolbar change
// (this is what makes the page follow the toggle instead of freezing on the
// language it first rendered in); `SET_GLOBALS` fires once on load. Both carry
// the full globals object.

interface PreviewWithGlobals {
  storyStore?: { userGlobals?: { get?: () => { locale?: string } | undefined } }
}

const currentLocale = (): string => {
  const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: PreviewWithGlobals }).__STORYBOOK_PREVIEW__
  return preview?.storyStore?.userGlobals?.get?.()?.locale ?? 'fa-IR'
}

export const Localized = ({ fa, en }: { fa: ReactNode; en: ReactNode }): ReactNode => {
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

  return locale === 'en-US' ? en : fa
}
