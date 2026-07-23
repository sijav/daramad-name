Read by almost everything: the calendar drives every date on screen, the locale
every number, the theme every colour.

It never suspends and never returns undefined; it falls back to the defaults
instead. So a mistake here produces no error, only wrong output. Two things are
pinned down: what the first paint shows someone who has never opened the app,
and that the fallback yields once a real row exists. Getting the second wrong
renders every date in the wrong calendar, forever.

## stories

- `First Ever Visit`: Nothing persisted yet. The first paint happens before IndexedDB answers, so every component formats its dates and numbers against this fallback. Without it they would read `undefined.calendar` and nothing would render; with a partial one they would format Jalali dates as Gregorian for a frame.
- `Persisted Settings Replace The Fallback`: A returning user who has changed their settings. The fallback must yield the moment the stored row arrives. If it did not, or if the query key drifted so the read never matched, the saved calendar and language would be ignored on every visit.
