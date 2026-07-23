## props

- `anchorEl`: What the popover hangs off, and whether it is open at all: `null` is closed.
- `filter`: The APPLIED filter. The draft is rebuilt from it each time the popover opens.
- `onApply`: Fires on Apply only, never per keystroke, or the ledger refetches mid-edit.
- `onClose`: Dismissed without applying; the draft is discarded.

## stories

- `Open`: The popover as it opens on an unfiltered ledger, every control at its resting value.
- `Pre Filled From The Active Filter`: Reopened on an existing filter, the draft starts from what is already applied.
- `Dates Start Empty`: Both date fields open EMPTY, never today, which would advertise a filter that is not applied.
- `Apply Commits The Draft`: Apply commits the draft in one go.
- `Reset Clears Without Applying`: Reset empties the draft without committing anything.
