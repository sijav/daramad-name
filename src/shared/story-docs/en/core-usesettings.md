Read by almost everything: the calendar drives every date on screen, the
locale every number, the theme every colour.

It never suspends and never returns undefined, falling back to the defaults
instead, which is exactly why a mistake here is silent. Two things are worth
pinning down: what the very first paint shows someone who has never opened
the app, and that the fallback gets out of the way once a real row exists.
Getting the second wrong would ignore a saved calendar and render every date
in the wrong system, forever, with no error.

## stories

- `First Ever Visit`: A first-ever visitor, with nothing persisted yet. The first paint happens before IndexedDB answers, so every component on screen formats its dates and numbers against this fallback. Without it they would read `undefined.calendar` and the app would not render at all; with a partial one they would quietly format Jalali dates as Gregorian for a frame.
- `Persisted Settings Replace The Fallback`: A returning user who has changed their settings. The fallback must yield the moment the stored row arrives. If it did not, or if the query key drifted so the read never matched, the user's saved calendar and language would be silently ignored on every visit.
