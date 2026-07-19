import '@fontsource-variable/vazirmatn'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from 'src/App'
import { DEFAULT_LOCALE, activateLocale } from 'src/core/i18n'

// `BASE_URL` keeps routing correct on GitHub Pages, which serves the app from a
// repository subpath rather than the domain root.
const container = window.document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

// The catalog is activated before the first render so no component ever paints
// with untranslated message ids.
await activateLocale(DEFAULT_LOCALE)

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
