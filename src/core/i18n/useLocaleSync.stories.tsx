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

// `useLocaleSync` is a gate on the FIRST paint, and that scope is the point.
//
// Lingui does not fall back when a catalog is missing — it THROWS. So if `App`
// rendered a page before the persisted locale had been activated, the whole
// tree would blow up rather than briefly showing English. `ready` is what
// prevents that, and it has two halves that fail in opposite ways:
//
//   · seeded from `i18n.locale === locale`, so a normal reload — where the
//     catalog is already active — paints immediately instead of flashing a
//     loader on every navigation;
//   · false on a mount whose persisted locale is NOT the active one, held shut
//     by the effect until that catalog lands.
//
// Once open it stays open. A language switch mid-session is a soft swap: some
// catalog is already loaded, so `i18n._` cannot throw, and blanking the whole
// app behind a spinner to change a setting would be worse than a moment of the
// previous language. Both stories below therefore exercise first mount, which
// is the only state the gate has an opinion about.
//
// `globals` are pinned rather than left to the toolbar: the hook compares the
// persisted locale against the SHARED `i18n` singleton, which the preview
// decorator activates from the Language toolbar. Unpinned, switching that
// toolbar inverts both first-paint assertions at once.

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
  argTypes: {
    locale: {
      control: 'inline-radio',
      options: ['fa-IR', 'en-US'],
    },
  },
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

export const AlreadyActiveLocalePaintsImmediately: Story = {
  // Persisted locale AND active catalog are both fa-IR, which is what "already
  // active" means. Under the English toolbar this story tests the opposite case.
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('true')
    await expect(await canvas.findByTestId('label')).toHaveTextContent('جمع کل درآمد')
  },
}

export const AWaitingLocaleHoldsTheGateShut: Story = {
  args: { locale: 'en-US' },
  // The MISMATCH is the fixture: en-US persisted against the fa-IR catalog the
  // decorator activated. With the toolbar on English there is nothing to wait
  // for and the gate opens on the first paint, which is the opposite assertion.
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Shut on the first paint: nothing downstream got a chance to call `i18n._`.
    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('false')

    await waitFor(async () => await expect(await canvas.findByTestId('ready')).toHaveTextContent('true'))
    await expect(await canvas.findByTestId('label')).toHaveTextContent('Total income')
    await expect(canvas.queryByTestId('waiting')).toBeNull()
  },
}
