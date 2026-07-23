## stories

- `Empty`: The resting state, and how the ledger toolbar opens: the placeholder carries the only hint of what the field searches.
- `With Query`: The clear button only appears once there is something to clear.
- `Clear Appears Only With A Query`: Two things that are invisible when they break. The field has no visible label by design, so its only accessible name is the `aria-label`, lose it and a screen-reader user hears "edit text" on the one control that filters the whole ledger. And the clear button is conditional: a permanent ✕ reads as "a filter is active" on an empty ledger, which sends the user hunting for a filter that was never applied.
