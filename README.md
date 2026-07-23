# DaramadName · درآمدنامه

A local-first income ledger and printable income certificate, for Iranian
freelancers.

[فارسی](./README.fa.md) · [Live demo](https://sijav.github.io/daramad-name/) ·
[Component library](https://sijav.github.io/daramad-name/storybook/)

An Iranian freelancer is **بی‌سند** (bi-sanad), a person without documents: no
payslip, no certificate of income. An embassy, a landlord and an accountant all
want a document that does not exist. DaramadName builds it from the receipts you
record yourself.

**Your data never leaves your browser.** No account, no server, no backend.

> Status: **MVP** (`0.1.0-alpha.1`). Every scenario below works end to end.

## What it does

- Record a receipt in about 15 seconds; a foreign-currency amount freezes its
  exchange rate at the moment you enter it.
- Filter and total the ledger by client and date range.
- Produce a bilingual Persian/English PDF income certificate.
- See a 12-month income chart, with a warning when one client is too much of
  your income.
- Back up and restore as a JSON file you carry between devices.

| #   | Scenario                                             | Status |
| --- | ---------------------------------------------------- | ------ |
| 1   | Foreign-currency receipt in 15 seconds, rate frozen  | ✅     |
| 2   | Filter the ledger by client and range, exact total   | ✅     |
| 3   | Bilingual PDF income report                          | ✅     |
| 4   | 12-month chart plus single-client dependency warning | ✅     |
| 5   | Backdated receipt, with the rate relabelled          | ✅     |
| 6   | JSON backup and restore                              | ✅     |

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run build` · `npm test` · `npm run lint` · `npm run storybook`. The story
suite runs in a real Chromium, so install it once with
`npx playwright install chromium`.

## Where is my data?

On your machine, in your browser's IndexedDB, and nowhere else. There is no
backend, so nothing is uploaded, synced or tracked, and the PDF is generated in
the page too. Moving between devices is a JSON file you export from Settings.
Restoring it **replaces** what is there rather than merging, and a private window
forgets everything when it closes, so keep the backup somewhere you trust: it is
the only copy outside the browser.

## Design decisions worth knowing

- **A recorded Toman value is frozen**, computed once on write and never
  recomputed, so a later move in the exchange rate cannot rewrite what you were
  actually paid.
- **The monthly average divides by months elapsed, not months with income**,
  because that is how an embassy reads "earns per month".
- **A backdated receipt asks for the rate on that date**, not today's, and warns
  that the value is frozen.

The rest of these, and the reasoning behind the architecture, are in
[AGENTS.md](./AGENTS.md).

## How it's built

Written by Claude Code, Anthropic's coding agent, directed by Sina and designed
by Gandom in Figma, under a written rulebook the tooling enforces rather than on
vibes. The rules, the folder layout and the load-bearing decisions live in
[AGENTS.md](./AGENTS.md); every suppression and version pin in
[TECH-DEBT.md](./TECH-DEBT.md), and the scope left out in `PHASE-NEXT.md`.

Stack: React 19, TypeScript, MUI, Lingui, Dexie over IndexedDB, Storybook,
Vitest.

## Deployment

GitHub Pages (the demo) and [Liara](https://liara.ir/), whose Iranian data
centres stay reachable from Iran. Vercel and Netlify are avoided because their
infrastructure blocks sanctioned countries.
