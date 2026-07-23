## props

- `onEdit`: Opens the edit dialog on that row.

## stories

- `Default`: One trigger per ledger row. A menu rather than three inline icon buttons: the row already carries a channel Tag and two money columns, and each action gets a readable label instead of an icon to decode.
- `Each Action Runs Its Own Callback`: Every action in this menu is wired through the same `run()` helper, so a swapped argument would send "delete" where "view" was clicked and nothing would look wrong until a receipt disappeared. Each item is therefore clicked separately and the other two spies are asserted to be untouched. The menu is portalled, it is NOT inside `canvasElement`, which is why the items are queried from the document body.
- `Dismissing Runs Nothing`: Dismissing the menu must not run anything. The delete item sits one row below the pointer, and this ledger has no server copy, a close that fired the highlighted action would be unrecoverable.
