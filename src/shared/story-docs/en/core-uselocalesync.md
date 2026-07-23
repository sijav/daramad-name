A gate on the first paint, and nothing more than that.

Lingui throws when a catalog is missing rather than falling back, so rendering
a page before the persisted locale is active takes the whole tree down instead
of briefly showing English. `ready` guards that. It starts true when
`i18n.locale` already matches, so an ordinary reload paints at once instead of
flashing a loader, and false when it does not, held shut by the effect until the
catalog lands.

Once open it stays open. Switching language mid-session is a soft swap: a
catalog is already loaded, so `i18n._` cannot throw, and a full-page spinner to
change a setting costs more than a moment of the previous language.

## props

- `locale`: The persisted locale the gate is asked to activate before the first paint.

## stories

- `Already Active Locale Paints Immediately`: The ordinary case: the persisted locale is already active, so the gate opens on the first paint. Starting false here would flash a full-page spinner on every reload and every route change.
- `A Waiting Locale Holds The Gate Shut`: The user switched to English in Settings and reloaded. The persisted locale no longer matches the active catalog, so the gate holds, then opens onto the English catalog rather than the message ids that happen to look like English.
