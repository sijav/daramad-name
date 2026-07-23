import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { expect, fn, waitFor, within } from 'storybook/test'
import { InstallAppSection } from './InstallAppSection'

const meta = {
  title: 'PWA/InstallAppSection',
  component: InstallAppSection,
} satisfies Meta<typeof InstallAppSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Builds the Chromium-only `beforeinstallprompt` event, which no test runner
 * can make the browser fire on its own. `Object.assign` rather than a subclass
 * of `Event`: `erasableSyntaxOnly` is on, and the real event is an ordinary
 * `Event` carrying three extra own properties anyway.
 */
const installPromptEvent = (outcome: 'accepted' | 'dismissed', onPrompt: () => void): Event =>
  Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    platforms: ['web'],
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
    prompt: () => {
      onPrompt()
      return Promise.resolve()
    },
  })

/**
 * Fires the event from a PARENT effect, not from the play function.
 *
 * React runs effects children-first, so by the time this one runs the hook
 * inside `InstallAppSection` has already subscribed. Dispatching from `play`
 * instead is a race: Storybook resolves the render before React has flushed
 * passive effects, so the event lands before anything is listening and the
 * section never appears.
 */
const Harness = ({ outcome, onPrompt }: { outcome: 'accepted' | 'dismissed'; onPrompt: () => void }) => {
  useEffect(() => {
    window.dispatchEvent(installPromptEvent(outcome, onPrompt))
  }, [outcome, onPrompt])

  return <InstallAppSection />
}

export const NotOffered: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('button')).toBe(null)
  },
}

export const Offered: Story = {
  render: () => <Harness outcome="dismissed" onPrompt={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { name: 'نصب برنامه' })).toBeVisible()
    await expect(await canvas.findByRole('button', { name: 'نصب' })).toBeVisible()
  },
}

const onPrompt = fn()

export const PromptsAndClears: Story = {
  render: () => <Harness outcome="accepted" onPrompt={onPrompt} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: 'نصب' }))

    await waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'نصب' })).toBe(null))
  },
}
