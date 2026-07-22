// `beforeinstallprompt` is a Chromium-only extension to the install spec, so it
// is absent from TypeScript's DOM library — as is `appinstalled`, which every
// engine that supports installation fires. Both are declared here rather than
// reached through a cast, which the working agreement forbids.
//
// Named `installEvents.d.ts` with no `installEvents.ts` beside it on purpose: a
// `.d.ts` sharing a basename with a `.ts` is treated as that file's generated
// output and dropped from the program without an error.

export {}

declare global {
  /** The outcome the user picked in the browser's own install dialog. */
  interface AppInstallChoice {
    outcome: 'accepted' | 'dismissed'
    platform: string
  }

  interface BeforeInstallPromptEvent extends Event {
    /** The install surfaces this event covers, e.g. `['web']`. */
    readonly platforms: readonly string[]
    readonly userChoice: Promise<AppInstallChoice>
    /** Shows the browser's install dialog. Usable once, and only from a user gesture. */
    prompt: () => Promise<void>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
}
