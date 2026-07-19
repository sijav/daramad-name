import { I18nProvider } from '@lingui/react'
import { Box, CircularProgress } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Route, Routes } from 'react-router-dom'
import { i18n, useLocaleSync } from 'src/core/i18n'
import { queryClient, useSettings } from 'src/core/query'
import { RtlProvider } from 'src/core/theme'
import { QuickEntryPage } from 'src/pages/quick-entry'
import { AppErrorFallback } from 'src/shared/error-state'
import { AppShell } from 'src/shared/layouts'

// Quick entry is the landing page and stays in the main bundle — it must be
// instant. The rest are split: the charts page pulls in @mui/x-charts and the
// report page pulls in pdfmake, and neither should be paid for on first load.
// Half the demo traffic arrives on a phone, often on a slow connection.
const LedgerPage = lazy(() => import('src/pages/ledger').then((m) => ({ default: m.LedgerPage })))
const ChartsPage = lazy(() => import('src/pages/charts').then((m) => ({ default: m.ChartsPage })))
const ReportPage = lazy(() => import('src/pages/report').then((m) => ({ default: m.ReportPage })))
const SettingsPage = lazy(() => import('src/pages/settings').then((m) => ({ default: m.SettingsPage })))

const PageLoader = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
)

/**
 * Everything below the query client, because the active locale and text
 * direction are read from persisted Settings — which is itself a query.
 */
const LocalisedApp = () => {
  const { locale } = useSettings()
  const localeReady = useLocaleSync()

  return (
    <I18nProvider i18n={i18n}>
      <RtlProvider locale={locale}>
        {localeReady ? (
          <ErrorBoundary FallbackComponent={AppErrorFallback}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<QuickEntryPage />} />
                  <Route path="ledger" element={<LedgerPage />} />
                  <Route path="charts" element={<ChartsPage />} />
                  <Route path="report" element={<ReportPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  {/* Unknown paths fall back to the entry page rather than a dead end. */}
                  <Route path="*" element={<QuickEntryPage />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        ) : (
          <PageLoader />
        )}
      </RtlProvider>
    </I18nProvider>
  )
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocalisedApp />
  </QueryClientProvider>
)
