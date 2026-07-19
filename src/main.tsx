import '@fontsource-variable/vazirmatn'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from 'src/App'

// `BASE_URL` keeps routing correct on GitHub Pages, which serves the app from a
// repository subpath rather than the domain root.
const container = window.document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
