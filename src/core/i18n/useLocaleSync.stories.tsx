import { msg } from '@lingui/core/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { defaultSettings } from 'src/core/db'
import { settingsQueryKey } from 'src/shared/queries'
import type { AppLocale } from 'src/shared/types'
import { expect, waitFor, within } from 'storybook/test'
import { i18n } from './i18n'
import { useLocaleSync } from './useLocaleSync'

// `useLocaleSync` is a gate, and the gate is the point.
//
// Lingui does not fall back when a catalog is missing — it THROWS. So if `App`
// rendered a page before the persisted locale had been activated, the whole
// tree would blow up rather than briefly showing English. `ready` is what
// prevents that, and it has two halves that fail in opposite ways:
//
//   · seeded from `i18n.locale === locale`, so a normal reload — where the
//     catalog is already active — paints immediately instead of flashing a
//     loader on every navigation;
//   · flipped by an effect, so switching language in Settings holds the gate
//     shut until the new catalog has actually landed.

const Gate = () => {
  const ready = useLocaleSync()
  // Kept from the first render so the "was the gate ever shut?" question
  // survives the state flip.
  const [firstPaint] = useState(ready)

  return (
    <div>
      <span data-testid="first-paint">{String(firstPaint)}</span>
      <span data-testid="ready">{String(ready)}</span>
      {/* Resolved only behind the gate — calling this before a catalog is
          active is the exact crash the hook exists to prevent. */}
      {ready ? <span data-testid="label">{i18n._(msg`Total income`)}</span> : <span data-testid="waiting">…</span>}
    </div>
  )
}

/** Settings live in a query, so the persisted locale is seeded as one. */
const Harness = ({ locale }: { locale: AppLocale }) => {
  const [client] = useState(() => {
    const created = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
    created.setQueryData(settingsQueryKey, { ...defaultSettings, locale })
    return created
  })

  return (
    <QueryClientProvider client={client}>
      <Gate />
    </QueryClientProvider>
  )
}

const meta = {
  title: 'Core/useLocaleSync',
  component: Harness,
  args: { locale: 'fa-IR' },
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The ordinary case: the persisted locale is already the active one.
 *
 * The gate must be open on the FIRST paint. If `ready` started false here, every
 * reload and every route change would flash a full-page spinner before the
 * dashboard appeared.
 */
export const AlreadyActiveLocalePaintsImmediately: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('true')
    await expect(await canvas.findByTestId('label')).toHaveTextContent('جمع کل درآمد')
  },
}

/**
 * The user has switched to English in Settings and reloaded.
 *
 * The persisted locale no longer matches the active catalog, so the gate must
 * hold — and then open onto the English catalog, not onto the message ids that
 * happen to look like English.
 */
export const AWaitingLocaleHoldsTheGateShut: Story = {
  args: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Shut on the first paint: nothing downstream got a chance to call `i18n._`.
    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('false')

    await waitFor(async () => await expect(await canvas.findByTestId('ready')).toHaveTextContent('true'))
    await expect(await canvas.findByTestId('label')).toHaveTextContent('Total income')
    await expect(canvas.queryByTestId('waiting')).toBeNull()
  },
}
