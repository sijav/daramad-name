import { useMediaQuery } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

export interface InstallPromptState {
  /** True only once the browser has offered installation and the app is not already installed. */
  canInstall: boolean
  /** True while the app is running from its own installed window. */
  isInstalled: boolean
  /** Opens the browser's install dialog. Must be called from a user gesture. */
  promptInstall: () => Promise<void>
}

/**
 * Owns the `beforeinstallprompt` handshake.
 *
 * Chrome fires that event when its installability criteria are met, and — if
 * the event is cancelled — hands the page a one-shot handle to the install
 * dialog. Cancelling it is what suppresses Chrome's own mini-infobar, so the
 * button in Settings becomes the single, predictable way in rather than a
 * second prompt competing with the browser's.
 *
 * The handle is single-use: after `prompt()` resolves the event is spent, so it
 * is dropped and the button disappears. Chrome fires a fresh event on the next
 * load if the app is still not installed.
 */
export const useInstallPrompt = (): InstallPromptState => {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installedThisSession, setInstalledThisSession] = useState(false)

  // Every display mode an installed window can run in. `useMediaQuery` rather
  // than a hand-rolled `matchMedia` listener: it already subscribes to changes,
  // so moving a window in or out of standalone updates without a reload.
  const isStandalone = useMediaQuery('(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)')

  useEffect(() => {
    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setDeferredEvent(event)
    }

    // Fired when the install completes — including an install started from
    // Chrome's own omnibox icon, which never goes through `promptInstall`.
    const onAppInstalled = () => {
      setDeferredEvent(null)
      setInstalledThisSession(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) {
      return
    }
    await deferredEvent.prompt()
    await deferredEvent.userChoice
    // Spent either way. A dismissal leaves the app uninstalled, and Chrome will
    // offer a new event on a later visit; reusing this one throws.
    setDeferredEvent(null)
  }, [deferredEvent])

  const isInstalled = isStandalone || installedThisSession

  return {
    canInstall: deferredEvent !== null && !isInstalled,
    isInstalled,
    promptInstall,
  }
}
