The printable route takes **all** of its configuration from the query string: no state, no props and no picker on the page.

So these stories differ only in the address handed to the router, which is exactly what the report page does when it opens the certificate in a new tab.

The backdrop and the print button paint immediately, but the document itself waits on `useCertificateModel`. That hook dynamically imports the report's message catalog, which is what lets a Persian interface produce an English document.

The previous-year subtlety: the page fixtures seed only the current year's report key. `?year=` builds a different one, so that story misses the cache and reads Dexie directly. An empty Dexie totals zero, and the page answers zero with the no-income notice rather than a document, which is why that story seeds Dexie itself.

## stories

- `Persian`: The Persian certificate, and the reason this route sits OUTSIDE the app shell. Everything the browser paints here ends up on paper. A nav rail, a bottom bar or a stray toolbar would print onto a document someone hands to an embassy, so the page is asserted to carry exactly one control, the print button, and that control is asserted to be marked `no-print`. The document title matters for the same reason: the browser names the saved PDF after it, and a file called «درآمدنامه.pdf» tells the person receiving it nothing. It has to be the reference printed on the page.
- `English`: `?lang=en` is the only thing that makes this the English document, and the report page builds that URL by hand. If the parameter stopped being read, the user would click "English", get a new tab, and hand a Persian page to an embassy without noticing. So this asserts the VALUES, not the labels: no Persian numeral may survive anywhere in the document, and the Latin spelling of the name, the one the holder entered to match their passport, is the one printed.
- `Another Year`: `?year=` selects the period. It comes from a link the user clicked on another page, so nothing on this page can correct it, a certificate silently covering the wrong twelve months is indistinguishable from a correct one until someone checks it against a bank statement.
- `No Income For That Year`: A year the holder recorded nothing in. `?year=` is a hand-editable part of a URL that opens in a new tab, so the report page's own refusal to export an empty year does not reach this route. A certificate stating zero is not a neutral outcome: it is a signed-looking statement that the person earned nothing, and it would be produced by the same layout, serial and letterhead as a real one.
