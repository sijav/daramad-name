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

// Activate the default catalog before the first paint. `useLocaleSync` then
// switches to the persisted choice once Settings loads from IndexedDB — this
// only avoids a flash of English message ids on a cold start.
await activateLocale(DEFAULT_LOCALE)

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
