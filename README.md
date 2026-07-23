# DaramadName / درآمدنامه

A receipts ledger and a presentable income report, for Iranian freelancers.

[فارسی](./README.fa.md)

An Iranian freelancer is **بی‌سند** (bi-sanad), a person without documents: no
payslip, no certificate of income. An embassy, a landlord and an accountant all
want a document that does not exist. This tool produces it from the user's own
recorded receipts.

**Every piece of data stays in your own browser and is never sent anywhere.**

> Status: **MVP**. Every scenario in the brief works end to end, but this has not
> been through a beta, so the version is `0.1.0-alpha.1` rather than `0.1.0`.

---

## Why there is no backend

This is a decision, not a gap. All six scenarios in the brief run entirely in
the browser: the exchange rate is typed in by hand (so no rate API), there is no
login (so no auth), and moving between devices is a JSON file (so no sync).

A server would carry no responsibility in this architecture and would, in
exchange, break the privacy claim printed in the footer. The one capability that
is lost is a signed, verifiable PDF, recorded in
[PHASE-NEXT.md](./PHASE-NEXT.md).

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command                                         | What it does                    |
| ----------------------------------------------- | ------------------------------- |
| `npm run dev`                                   | Dev server                      |
| `npm run build`                                 | Production build                |
| `npm run lint`                                  | ESLint, zero warnings tolerated |
| `npm run lint:tsc`                              | Typecheck                       |
| `npm test`                                      | Unit and story suites           |
| `npm run format`                                | Prettier                        |
| `npm run storybook`                             | Storybook on port 6006          |
| `npm run i18n:extract` / `npm run i18n:compile` | lingui catalogs                 |

The story suite runs every story in a real Chromium, so it needs Playwright's
browser once: `npx playwright install chromium`.

## Architecture

```
src/
  core/          # singletons: database, theme, query client
    db/          # Dexie over IndexedDB, the whole storage layer
    query/       # TanStack Query config and central invalidation
    theme/       # Figma tokens to MUI theme, and RTL
  pages/         # the brief's five pages
  shared/        # components, queries, types, utilities
    queries/     # *.query.ts and *.mutation.ts, IndexedDB reads and writes
    story-docs/  # the Docs pages' prose, in both languages (en/ and fa/)
  locales/       # lingui catalogs (source: en-US, translation: fa-IR)
```

### Storybook documentation

Everything a Docs page prints, the page description, each prop's description and
each story's note, lives in `src/shared/story-docs/` rather than in the code:
one markdown file per page in `en/`, one in `fa/`. The Language toolbar switches
all three at once, and renders each story heading as «نام فارسی (English Name)».

The format and the reasoning are in
[`story-docs/README.md`](./src/shared/story-docs/README.md). `storyDocs.test.ts`
fails if the two sides drift: a prop or story with no translation, or a
translation naming something that no longer exists.

### Language

Message ids are written in **English** (lingui's source locale) and Persian is
kept as a translation in `src/locales/fa-IR/messages.po`. The interface defaults
to Persian and the user can switch to English in Settings; the choice persists
and flips text direction with it.

`lingui/no-unlocalized-strings` rejects any unlocalized string, English as
readily as Persian.

### Conventions

- Every folder has an `index.ts`; cross-module imports go through that barrel.
- No upward relative imports (`../`); always absolute `src/...`.
- Browser globals through `window.*`, so they stay mockable.
- Query file name matches the function: `getLedger.query.ts` exports
  `getLedgerQuery`.

### A few decisions that look odd

**The Toman value is frozen at the moment of recording.** `amountToman` is
computed and stored once on write and never recomputed on read. If Tether rises
later, a past receipt must not change, because that figure is what was actually
received.

**A backdated receipt relabels the rate field.** Scenario 1 says "today's rate"
and scenario 5 records a receipt from two months ago. Taken together naively, a
Mordad receipt gets today's rate frozen into it forever. When the date is not
today, the form relabels the field to "the rate on that date" and warns.

**The monthly average divides by the months in the period, not by the months
with income.** An embassy reads that number as "what they earn per month";
dividing by only the productive months inflates it and makes the report
misleading.

**The calendar's Persian digits come from the font, not the adapter.** MUI X
measures each date section with `formatByString(...).startsWith('0')` against an
ASCII zero, so an adapter returning Persian digits makes the picker throw.
Vazirmatn's Farsi-Digits cut draws ASCII digits with Persian glyphs, so the DOM
stays ASCII while the user sees Persian.

**Restoring a backup replaces, it does not merge.** Merging needs a definition
of "the same receipt" that does not exist, and restoring one file twice would
silently double someone's income, the worst possible failure for a tool whose
entire value is an accurate total.

## Live demo

- App: https://sijav.github.io/daramad-name/
- Storybook (the component library): https://sijav.github.io/daramad-name/storybook/

## Deployment

Two independent targets, deliberately:

- **[Liara](https://liara.ir/)** (the demo link), an Iranian company with
  Iranian data centres. Neither sanctioned nor filtered. To enable it, put
  `LIARA_API_TOKEN` in repository secrets and `LIARA_APP_NAME` in variables.
  Until the token exists, that job skips silently.
- **GitHub Pages** (the fallback), free, and reachable from Iran for public
  repositories.

Vercel and Netlify were ruled out deliberately: their infrastructure (AWS)
blocks sanctioned countries.

## Scenario status

| #   | Scenario                                                     | Status |
| --- | ------------------------------------------------------------ | ------ |
| 1   | Record a foreign-currency receipt in 15 seconds, rate frozen | ✅     |
| 2   | Filter the ledger by client and range, with an exact total   | ✅     |
| 3   | Bilingual PDF report                                         | ✅     |
| 4   | 12-month chart plus client-dependency warning                | ✅     |
| 5   | Backdated receipt                                            | ✅     |
| 6   | JSON backup and restore                                      | ✅     |
