## props

- `onPickClient`: Fills the form's client field. Without it the "recent clients" chips are inert, an outlined chip in a form column reads as tappable, so a user taps one, nothing happens, and they type the name by hand. That is also how a second «Aria Trading » gets created and splits a client's totals.

## stories

- `Default`: The support column as the entry page opens: today's total, the last receipt, and the clients most likely to be picked next.
- `Picking A Client Reports The Name`: Tapping a recent client hands the name back, so the form can fill itself.
- `Without A Handler The Chips Are Not Buttons`: With no handler the chips must not pretend to be actionable. `onPickClient` is optional, and a chip that renders as a button while doing nothing is the defect this component already had once.
