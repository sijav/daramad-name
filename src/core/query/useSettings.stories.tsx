import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { db, defaultSettings } from 'src/core/db'
import { expect, waitFor, within } from 'storybook/test'
import { useSettings } from './useSettings'

// `useSettings` is read by almost everything: the calendar drives every date on
// screen, the locale drives every number, the theme drives every colour. It
// never suspends and never returns undefined — it falls back to the defaults —
// which is exactly why a mistake here is silent.
//
// Two things are worth pinning down: what the very first paint shows a
// first-ever visitor (before IndexedDB has answered, and before it contains
// anything to answer with), and that the fallback gets out of the way once a
// real row exists. Getting the second wrong would ignore a user's saved
// calendar and render every date in the wrong system, forever, with no error.

const Report = () => {
  const settings = useSettings()
  // Captured on the very first render, so the fallback stays observable after
  // the query has resolved and overwritten it.
  const [firstPaint] = useState(settings)

  const line = (value: typeof settings) => `${value.calendar}/${value.locale}/${value.themePreference}`

  return (
    <dl>
      <dt>first paint</dt>
      <dd data-testid="first-paint">{line(firstPaint)}</dd>
      <dt>settled</dt>
      <dd data-testid="settled">{line(settings)}</dd>
    </dl>
  )
}

/**
 * Its own query client, so the hook reads the real database rather than the
 * cache Storybook's decorator pre-seeds for every story.
 */
const Harness = () => {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))

  return (
    <QueryClientProvider client={client}>
      <Report />
    </QueryClientProvider>
  )
}

const meta = {
  title: 'Core/useSettings',
  component: Harness,
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

const DEFAULTS = `${defaultSettings.calendar}/${defaultSettings.locale}/${defaultSettings.themePreference}`

export const FirstEverVisit: Story = {
  beforeEach: async () => {
    await db.settings.clear()
    return async () => await db.settings.clear()
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent(DEFAULTS)
    // Jalali and Persian specifically: this app is for Iranian freelancers, and
    // a Gregorian first frame would be the wrong calendar for its whole audience.
    await expect(await canvas.findByTestId('settled')).toHaveTextContent('JALALI/fa-IR/system')
  },
}

export const PersistedSettingsReplaceTheFallback: Story = {
  beforeEach: async () => {
    await db.settings.put({
      key: 'settings',
      ...defaultSettings,
      calendar: 'GREGORIAN',
      locale: 'en-US',
      themePreference: 'dark',
    })
    return async () => await db.settings.clear()
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('first-paint')).toHaveTextContent(DEFAULTS)
    await waitFor(async () => await expect(await canvas.findByTestId('settled')).toHaveTextContent('GREGORIAN/en-US/dark'))
  },
}
