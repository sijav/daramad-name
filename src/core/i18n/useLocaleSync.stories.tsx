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

// Both stories pin `globals.locale`. The hook compares the persisted locale
// against the shared `i18n` singleton, which the preview decorator activates
// from the Language toolbar, so leaving it to the toolbar inverts both
// first-paint assertions at once.

const Gate = () => {
  const ready = useLocaleSync()
  // `ready` only ever flips to true, so this is the sole record of the gate
  // having been shut.
  const [firstPaint] = useState(ready)

  return (
    <div>
      <span data-testid="first-paint">{String(firstPaint)}</span>
      <span data-testid="ready">{String(ready)}</span>
      {/* `i18n._` throws while no catalog is active, which is what the gate is for. */}
      {ready ? <span data-testid="label">{i18n._(msg`Total income`)}</span> : <span data-testid="waiting">…</span>}
    </div>
  )
}

// The hook reads the locale from settings, so the fixture is a seeded query.
// First mount is the only state the hook has an opinion about, so moving the
// control has to rebuild the client AND the gate. Keying the session on the
// locale remounts both, which `useState` then re-initialises; a `useMemo` on
// the client would be a performance hint React is free to discard, handing the
// gate an unseeded client mid-story.
const Harness = ({ locale }: { locale: AppLocale }) => <Session key={locale} locale={locale} />

const Session = ({ locale }: { locale: AppLocale }) => {
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
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('true')
    await expect(await canvas.findByTestId('label')).toHaveTextContent('جمع کل درآمد')
  },
}

export const AWaitingLocaleHoldsTheGateShut: Story = {
  // The mismatch is the fixture: en-US persisted against the fa-IR catalog the
  // decorator activated.
  args: { locale: 'en-US' },
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent('false')

    await waitFor(async () => await expect(await canvas.findByTestId('ready')).toHaveTextContent('true'))
    await expect(await canvas.findByTestId('label')).toHaveTextContent('Total income')
    await expect(canvas.queryByTestId('waiting')).toBeNull()
  },
}
