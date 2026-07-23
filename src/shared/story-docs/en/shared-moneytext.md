## props

- `value`: The amount, in whichever currency is passed below.
- `currency`: Omit for toman; pass a currency to render the original amount instead.
- `showUnit`: Appends the currency name.

## stories

- `Toman`: The default: toman, grouped, with its unit. Every figure in the app comes through here, so the grouping and the unit can never differ between the ledger, the charts and the certificate.
- `Toman Rounded`: Toman never shows decimals, even for an amount that has them.
- `Dollars`: USD and USDT carry two decimals, the brief's edge case.
- `Tether`: Tether, the other two-decimal currency, and the one a freelancer is most likely to be paid in.
- `Zero`: A zero month must render as «۰», not as an empty cell.
- `Without Unit`: Without the unit, for a column whose header already says «تومان». The figure still has to be the same figure, the unit is the only thing that goes.
- `Direction Is Explicit`: Money is a bidirectional hazard: the digits run left to right inside a line that runs right to left, so an unmarked amount can render with its unit on the wrong end. The span states its own direction rather than inheriting it.
- `English`: English mode: Latin digits, commas, and the unit spelled out in English, and the direction flips with it.
- `English Dollars`: English dollars: two decimals survive the locale switch.
