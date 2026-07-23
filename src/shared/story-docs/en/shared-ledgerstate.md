## props

- `kind`: Which of the four states to show. Each has its own wording and its own icon.
- `onAction`: Retry for `error`, clear-filters for `no-results`, first-entry for `empty`.
- `errorMessage`: The raw cause, shown under the `error` state so a glitch is distinguishable from real damage.

## stories

- `Empty`: "You have not recorded anything", sends the user to quick entry.
- `No Results`: "Your filter matched nothing", a different situation needing the opposite action, so it clears filters instead.
- `Loading`: Skeleton rows while the query runs, sized to the table they replace so the page does not jump when the data lands.
- `Error`: The read failed. The default reassurance, with the retry the caller supplies.
- `No Results Clears Filters Instead`: The no-results action clears the filters rather than sending the user to quick entry. Wiring it to the wrong one would answer a full ledger with «record your first receipt».
- `The Two Empty States Are Different`: The two empty states must not read the same. "You have not recorded anything" and "your filter matched nothing" want OPPOSITE next actions, one sends the user to quick entry, the other clears the filters. Collapsing them tells a user with a full ledger that they have never recorded a receipt.
- `Error Shows The Real Cause`: A failure the user can act on has to say what failed. The default reassurance is right when there is nothing more to say, but a real message from the data layer, a quota error, a corrupt row, is what tells a glitch apart from data loss, so it replaces the default rather than sitting beside it.
- `Without An Action`: With no handler there is no button. An action that does nothing is worse than an absent one, the user presses it, nothing happens, and they conclude the app is broken rather than that the button was never wired.
- `Loading Is Announced`: Loading announces itself to a screen reader rather than only drawing skeletons.
