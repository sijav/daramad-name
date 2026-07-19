import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { useEffect, type ReactNode } from 'react'
import type { AppLocale, ThemePreference } from 'src/shared/types'
import { prefixer } from 'stylis'
import { getTheme, type ThemeMode } from './theme'

// Full direction support, not just `dir` on the body. The stylis plugin flips
// logical properties in the generated CSS, so margins, paddings, borders and
// drawer anchors mirror without any component writing direction-aware styles by
// hand.
//
// Two caches are built up front and selected by direction; rebuilding a cache
// on every switch would orphan the styles already injected under the old one.
const rtlCache = createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] })
const ltrCache = createCache({ key: 'mui-ltr', stylisPlugins: [prefixer] })

export interface AppThemeProviderProps {
  locale: AppLocale
  /** `system` follows the OS setting and keeps following it as it changes. */
  themePreference: ThemePreference
  children: ReactNode
}

export const AppThemeProvider = ({ locale, themePreference, children }: AppThemeProviderProps) => {
  const isRtl = locale === 'fa-IR'
  const direction = isRtl ? 'rtl' : 'ltr'

  // Tracked live rather than read once, so a user switching their OS to dark at
  // dusk sees the app follow without a reload.
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const mode: ThemeMode = themePreference === 'system' ? (prefersDark ? 'dark' : 'light') : themePreference

  const theme = getTheme(mode, direction)

  // Screen readers, native controls and scrollbars read these off the document,
  // not off the Emotion cache or the MUI theme.
  useEffect(() => {
    const root = window.document.documentElement
    root.dir = direction
    root.lang = locale
    root.style.colorScheme = mode
  }, [direction, locale, mode])

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
