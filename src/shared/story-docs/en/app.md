The whole app, mounted at a route, over the real database.

`App` is wiring, but the wiring decides three things no page-level story can
see: whether the locale gate opens at all (lingui throws rather than falling
back, so a stuck gate is a blank app), where each route lands, and which
routes sit inside the shell. The certificate matters most, being the document
a freelancer hands to an embassy or a landlord, and it must print with no
navigation attached to it.

Nothing is seeded into the query cache: `App` brings its own query client, so
these stories exercise the same IndexedDB path the real app does.

## stories

- `Ledger Route`: `/ledger` reaches the ledger, inside the shell, with the seeded receipts and a total computed from them. The total is asserted rather than just the rows: a route that renders but totals nothing looks fine in a screenshot.
- `Unknown Route Falls Back To The Dashboard`: An unknown path lands on the dashboard rather than a blank page. The app is shared as a link. A stale or mistyped URL that dead-ended would look like the app is broken, which for a tool someone is being asked to trust with their income is worse than it sounds.
- `Certificate Renders Without The App Chrome`: `/certificate` renders the printable document and NOTHING else. This route sits outside `AppShell` deliberately: the browser's own print engine turns the page into the PDF, so any nav bar, rail or footer still mounted would be printed onto the document a freelancer hands over. Moving the route inside the shell would break that without breaking anything a screenshot of the app would show.
- `Quick Entry Route`: `/quick-entry` resolves to the 15-second entry form, not to the fallback.
- `Charts Route`: `/charts` resolves to the charts page, which is the heaviest lazy chunk.
- `Report Route`: `/report` resolves to the page the certificate is produced from.
- `Settings Route`: `/settings` resolves to the page holding the profile, the backup and the erase.
