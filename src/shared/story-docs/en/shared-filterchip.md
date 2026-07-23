## props

- `field`: The filter's field name, shown before the value.
- `value`: The active value.

## stories

- `Client`: One applied filter, with the ✕ that undoes it.
- `Active Filters`: Together these are the only visible evidence of what the popover applied. A composed row, so the Controls panel is switched off rather than left describing a single chip that is not the one on screen. The field names go through the catalog the way LedgerPage's do, the value beside them is caller data and stays as it is.
- `Shows Field And Value Together`: The chip has to name the FIELD as well as the value. Two filters can share a value, a client called "Tether" and the Tether channel, and a chip reading only «تتر» leaves the user unable to tell which one is narrowing the ledger, which is the exact confusion the chips exist to prevent.
- `Removing Reports Upward`: Removing the chip is how a filter is undone; if the ✕ does not report, the user is stuck with a filtered total and only the popover to escape it. The ✕ is reached by role and name, not by class: MUI's clone keeps the `role` and `aria-label` FilterChip sets, and FilterChip cancels `SvgIcon`'s `aria-hidden` so both reach the accessibility tree. Asserting on the name is what stops that combination being dropped again.
