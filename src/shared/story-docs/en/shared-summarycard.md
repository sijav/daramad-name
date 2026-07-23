## props

- `label`: The caption above the figure. Left blank, each story falls back to its translated sample.
- `value`: A number renders as money through `MoneyText`; a string renders verbatim, for counts that are not amounts.
- `hint`: A line under the figure saying how it was derived, the averaging basis, on the report.
- `emphasis`: Paints the card in `primary.light`. At most one tile per row, or nothing is emphasised.
- `icon`: Shown in a 36px tinted chip beside the label.

## stories

- `Money`: The default tile: a money figure, its caption, and the icon chip.
- `Emphasised`: The emphasised tile, the one figure on a row that answers the page's question.
- `Count Rather Than Money`: `value` as a string: a receipt COUNT is not money, so it must not be grouped or given a currency, but it still has to be in the reader's digits, which is why the caller formats it rather than passing a bare number.
- `With Hint`: The hint line. On the report this is where the averaging basis is stated, a figure whose derivation is not on the page is a figure nobody can check.
- `Dashboard Row`: The dashboard's four-across row, the tiles must survive being narrow. A composition of four different cards, so there is no single card for the Controls panel to drive. It is switched off here rather than left looking live and doing nothing.
