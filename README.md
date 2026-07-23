# DaramadName · درآمدنامه

A local-first income ledger and printable income certificate, for Iranian
freelancers.

[فارسی](./README.fa.md) · [Live demo](https://sijav.github.io/daramad-name/) ·
[Component library](https://sijav.github.io/daramad-name/storybook/)

An Iranian freelancer is **بی‌سند** (bi-sanad), a person without documents: no
payslip, no certificate of income. An embassy, a landlord and an accountant all
want a document that does not exist. DaramadName builds it from the receipts you
record yourself.

**Your data never leaves your browser.** No account. No server. No backend.

> Status: **MVP** (`0.1.0-alpha.1`). All core scenarios are implemented.

## Features

- ⚡ Record a foreign-currency receipt in under 15 seconds, its exchange rate
  frozen the moment you enter it.
- 📄 Generate a bilingual (Persian/English) PDF income certificate.
- 📈 See a 12-month income chart, with a warning when one client is too much of
  your income.
- 💾 Local-first: your ledger stays in the browser and exports as a JSON backup.

## Quick start

```bash
npm install
npm run dev
```

Then open **http://localhost:5173**.

Other commands: `npm run build`, `npm test`, `npm run lint`, `npm run storybook`.
The story suite runs in a real Chromium, so install it once with
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

## How it's built

Vibe-coded, but the agent runs on a rulebook, not a vibe. It works to a fixed
set of instructions in [AGENTS.md](./AGENTS.md), enforced by the tooling rather
than by good faith: a string that skips localization fails the build, the
Storybook docs fail the moment a translation drifts, types are checked with no
escape hatches allowed, and nothing is called done until lint, typecheck, tests
and build all pass and the change has been seen running in the browser.

Built with React 19, TypeScript, MUI, Lingui, Dexie over IndexedDB, Storybook
and Vitest.

## Deployment

Deploys to [GitHub Pages](https://sijav.github.io/daramad-name/).
