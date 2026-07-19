import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import type { ReactNode } from 'react'
import { prefixer } from 'stylis'
import { theme } from './theme'

// Full RTL, not just `dir="rtl"` on the body. The stylis plugin flips logical
// properties in the generated Emotion CSS, so margins, paddings, borders and
// icon positions mirror without any component writing direction-aware styles
// by hand — pre-flight check 5.
const rtlCache = createCache({
  key: 'mui-rtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

export const RtlProvider = ({ children }: { children: ReactNode }) => (
  <CacheProvider value={rtlCache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </CacheProvider>
)
