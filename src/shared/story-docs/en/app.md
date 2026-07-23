The whole app, mounted at a route, over the real database.

`App` is wiring, but the wiring decides three things no page-level story can
see: whether the locale gate opens at all, where each route lands, and which
routes sit inside the shell. Lingui throws when a catalog is missing rather than
falling back, so a gate that never opens is a blank app.

Nothing is seeded into the query cache. `App` brings its own query client, so
these stories read the same IndexedDB the app does.

## stories

- `Ledger Route`: `/ledger` reaches the ledger inside the shell, with the seeded receipts and a total computed from them. The total is asserted as well as the rows, because a route that renders an empty total still looks right in a screenshot.
- `Unknown Route Falls Back To The Dashboard`: An unknown path lands on the dashboard rather than a blank page. The app is shared as a link, so a stale or mistyped URL that dead-ended would read as a broken app.
- `Certificate Renders Without The App Chrome`: `/certificate` renders the printable document and nothing else. It sits outside `AppShell` because the browser's print engine turns the page into the PDF: a nav bar, rail or footer still mounted would print onto the document.
- `Quick Entry Route`: `/quick-entry` resolves to the 15-second entry form, not to the fallback.
- `Charts Route`: `/charts` resolves to the charts page, the heaviest lazy chunk.
- `Report Route`: `/report` resolves to the page the certificate is produced from.
- `Settings Route`: `/settings` resolves to the page holding the profile, the backup and the erase.
