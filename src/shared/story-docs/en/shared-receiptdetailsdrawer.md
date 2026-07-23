## props

- `receipt`: The receipt to show; `null` closes the drawer. Selection is what opens it.
- `onClose`: Backdrop, Escape and the close button all arrive here.
- `onEdit`: Hands the same receipt back, so the caller need not track the selection twice.
- `onDelete`: Asks to delete. The confirmation belongs to the page, not the drawer.

## stories

- `Toman Receipt`: A toman receipt has no conversion, so no rate block and no frozen badge.
- `Foreign Currency Frozen`: The drawer is where the freeze rule becomes visible: the original amount, the rate it was captured at, and a badge saying it will not move. Without this a Tether receipt whose toman value never changes looks like a bug.
- `Without Note`: A receipt with no note must not leave an empty labelled block.
- `Shows The Stored Conversion`: The three numbers on this panel are the only place the user can audit a conversion: 1,500 USDT × 98,500 = 147,750,000. If the rate were rendered from anywhere other than the stored `rate`, the arithmetic printed here would stop reconciling and the "frozen" badge would be a false claim.
- `Toman Receipt Hides The Rate Block`: A toman receipt was never converted, so there is no rate to show. A "frozen at 0" row here would tell the user their receipt is pinned to an exchange rate that does not exist.
- `Is A Named Dialog With One Heading`: What the drawer announces when it opens. The paper IS the `role="dialog"`, and it had no accessible name (axe: `aria-dialog-name`), a screen reader said "dialog" and stopped. It is now pointed at the heading it already draws, so the two cannot drift apart. The heading count is asserted too: MUI maps the `subtitle2` variant onto `<h6>`, so every one of the eight captions used to be published as a level-6 heading under the drawer's single `<h3>`, a fake outline, and the level jump axe reports as `heading-order`.
- `Footer Actions Carry The Receipt`: Both footer buttons hand the receipt back out. Passing the wrong object, or nothing, would open the edit dialog on a different row, or delete one.
