The income certificate, as a page.

This one component is both the on-screen preview and the printed sheet, so
there is no second renderer to drift from. `@page` gives it real A4 geometry:
what the browser prints is what the user saw.

Its direction comes from the MODEL, not the app, an English certificate
reads left-to-right while the interface stays Persian.

## props

- `model`: Everything the document says, already localized and formatted. The component renders it and nothing else, the model carries its own direction and its own language, which is what lets a Persian interface produce an English certificate.
- `variant`: `page` draws real A4 geometry for printing. `preview` drops the fixed height and the paper shadow so the document can sit inside a card and flow with the page it is embedded in.

## stories

- `Page`: The printable page: real A4 geometry and a paper shadow. This is the same component the preview uses, so there is no second renderer to drift from. The play function checks that every field of the model reaches the page. A field silently dropped here is a field the PDF prints and the preview does not, which is exactly the drift the model was introduced to end.
- `Preview`: `preview` drops the fixed A4 geometry so the document can sit inside a card on the report page and flow with it. Same content, no paper.
- `English Inside A Persian App`: The direction override, and the reason `direction` is on the model rather than read from the app. An English certificate reads left to right while the interface around it stays Persian, the document is for the embassy, not for the user's screen.
- `Without Identity`: A profile with nothing filled in. The identity block disappears entirely rather than printing labels against blank space, an unfinished-looking form is the one thing this document cannot afford to be. `incomplete` is set because it is what the builder would set for this profile, but this component never reads it: the flag drives the report page's «نامت هنوز ثبت نشده» banner, and that is where it is covered.
- `Without The Total In Words`: An amount past the largest named scale has no reading in words, so the model hands the page an empty string. The row has to vanish with it, a «به حروف» label with nothing beside it reads as a figure that was tampered with.
- `Stays Paper In Dark Mode`: The sheet is paper in every theme. Its colours are literal rather than palette roles for exactly this reason, a document that inverts because the reader happened to have dark mode on is not a document, and the person receiving it never chose the theme it was printed under.
