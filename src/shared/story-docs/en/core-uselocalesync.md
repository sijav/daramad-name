A gate on the FIRST paint, and that narrow scope is the point.

Lingui does not fall back when a catalog is missing, it THROWS. So if `App`
rendered a page before the persisted locale had been activated, the whole
tree would blow up rather than briefly showing English. `ready` prevents
that, and it fails in opposite ways at each end: seeded from `i18n.locale ===
locale` so a normal reload paints immediately instead of flashing a loader on
every navigation, and false on a mount whose persisted locale is not the
active one, held shut by the effect until that catalog lands.

Once open it stays open. A language switch mid-session is a soft swap: some
catalog is already loaded, so `i18n._` cannot throw, and blanking the app
behind a spinner to change a setting would be worse than a moment of the
previous language.

## props

- `locale`: The persisted locale the gate is asked to activate before the first paint.

## stories

- `Already Active Locale Paints Immediately`: The ordinary case: the persisted locale is already the active one. The gate must be open on the FIRST paint. If `ready` started false here, every reload and every route change would flash a full-page spinner before the dashboard appeared.
- `A Waiting Locale Holds The Gate Shut`: The user has switched to English in Settings and reloaded. The persisted locale no longer matches the active catalog, so the gate must hold, and then open onto the English catalog, not onto the message ids that happen to look like English.
