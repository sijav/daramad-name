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

## Where is my data stored?

**On your own machine, in your own browser. Nowhere else.**

Every receipt, your client list and your personal details are written to
**IndexedDB**, the browser's own database, under the origin you opened the app
from. There is no account, no server and no database belonging to us, because
there is no backend at all. Nothing is uploaded, nothing is synced in the
background, and no analytics call leaves the page. The PDF certificate is
produced inside the page too, so its contents never leave your machine either.

That is a decision rather than a gap. All six scenarios in the brief run
entirely in the browser: the exchange rate is typed in by hand (so no rate API),
there is no login (so no auth), and moving between devices is a JSON file (so no
sync). A server would carry no responsibility here and would, in exchange, break
the privacy claim printed in the footer.

What follows from it, and is worth knowing before you rely on it:

- **The data belongs to that browser on that device.** Opening the app on your
  phone will not show what you recorded on your laptop. Clearing site data, or
  "clear browsing history" with site data ticked, erases it. So does
  uninstalling the browser.
- **Moving between devices is a file you carry.** Settings has Backup, which
  downloads a JSON file, and Restore, which reads one back. That file is the
  only copy that exists outside the browser, so keep it somewhere you trust.
- **Restore replaces, it does not merge.** Restoring a backup discards what is
  currently in the browser and puts the file's contents in its place.
- **Private or incognito windows forget everything** when the window closes,
  including your ledger.

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

## How this was built

The code, the tests and the documentation were written by **Claude Code**,
Anthropic's AI coding agent. Sina directed the build and reviewed every change;
Gandom designed it in Figma.

"Vibe coding" is the fashionable name for building with an agent, but it is a
poor fit here, which is rather the point. Vibe coding means trusting whatever
the model emits without reading it; this was the opposite. The agent worked to a
written agreement, and the agreement is held up by the tooling rather than by
good intentions.

Those rules live in **[`AGENTS.md`](./AGENTS.md)**, the first thing any agent (or
human) reads before touching the code. `CLAUDE.md` only points at it, so there is
one file to maintain rather than two that drift. It records the decisions that
are not up for renegotiation, each with the reason it exists: every user-facing
string goes through lingui in English, documentation prose lives in markdown and
never in the code, colours come from the theme and never a hardcoded hex, library
versions are checked against the registry rather than recalled from memory.

Most of those rules fail the build when broken, so they cannot quietly rot:

- `eslint-plugin-lingui` rejects any unlocalized string, English as readily as
  Persian.
- `storyDocs.test.ts` fails the moment a Docs page and its translation drift
  apart.
- `tsc` runs with the escape hatches banned (`as`, `@ts-ignore`), so a type
  mismatch has to be fixed rather than papered over.
- Nothing is called done until lint, typecheck, tests and build all pass
  (`npm run lint && npm run lint:tsc && npm test && npm run build`), and until
  the change has been seen rendering in the browser, not just typechecked.

Two more files close the loop: **[`TECH-DEBT.md`](./TECH-DEBT.md)** records every
suppression, version pin and workaround alongside the check that says when it can
go, and **`PHASE-NEXT.md`** records the scope deliberately left out. Nothing is
silenced without a written reason.

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
