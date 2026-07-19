import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { useEffect, useMemo, type ReactNode } from 'react'
import type { AppLocale } from 'src/shared/types'
import { prefixer } from 'stylis'
import { theme } from './theme'

// Full direction support, not just `dir` on the body. The stylis plugin flips
// logical properties in the generated Emotion CSS, so margins, paddings,
// borders and icon positions mirror without any component writing
// direction-aware styles by hand — pre-flight check 5.
//
// Persian is RTL and English is LTR, so BOTH the cache and the theme direction
// have to follow the locale. Two caches are built up front and selected by
// locale; rebuilding a cache on every switch would orphan already-injected
// styles.
const rtlCache = createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] })
const ltrCache = createCache({ key: 'mui-ltr', stylisPlugins: [prefixer] })

export const RtlProvider = ({ locale, children }: { locale: AppLocale; children: ReactNode }) => {
  const isRtl = locale === 'fa-IR'

  const directionalTheme = useMemo(() => ({ ...theme, direction: isRtl ? ('rtl' as const) : ('ltr' as const) }), [isRtl])

  // Screen readers and native controls (date pickers, scrollbars) read
  // direction off the document, not off the Emotion cache.
  useEffect(() => {
    window.document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    window.document.documentElement.lang = locale
  }, [isRtl, locale])

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <ThemeProvider theme={directionalTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
