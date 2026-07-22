# Technical debt

Every warning that is silenced, every workaround, and every version held back is
written down here — with what it costs, what would actually fix it, and how to
tell when it can go.

**Rule: nothing gets suppressed without an entry in this file.** A silenced
warning with no record is a decision nobody can revisit, and the reason it was
silenced is exactly what is lost first.

Ordered by how much it would hurt to leave forever.

---

## 1. Test runs exhaust the heap, so both hosts run with a raised ceiling

**Mitigated by** `scripts/vitest.mjs` and `scripts/storybook-dev.mjs`, which
both raise Node's heap ceiling to 20 GB (`VITEST_HEAP_MB` /
`STORYBOOK_HEAP_MB` override it).

**Symptom** `FATAL ERROR: Ineffective mark-compacts near heap limit` at
~4.09 GB, with `v8::ValueDeserializer::ReadValue` in the native stack. From the
Storybook Testing panel it presents as **"Connection lost"** partway through —
observed stopping at 66/252 and 113/252 — because the process being killed IS
the Storybook dev server.

**Cause** Vitest holds coverage reports in the main process for the whole run
rather than streaming them to disk
([vitest-dev/vitest#4476](https://github.com/vitest-dev/vitest/issues/4476)).
The Vitest addon runs the browser suite INSIDE the Storybook dev server, so that
process carries it. Node's default ceiling is 4288 MB.

**Measured** Baseline Storybook host 400 MB. A full run from the Testing panel
with Interactions + Coverage + Accessibility enabled peaks at **7908 MB** —
roughly 20x baseline, and nearly double the default ceiling. With the ceiling
raised the same run completes: 252 tests, 89% coverage, 103 accessibility
findings.

**Cheaper alternative** Unticking **Coverage** in the Testing panel removes most
of the growth. Worth doing when only interaction or a11y results are wanted.

**What would fix it** Upstream streaming coverage to disk instead of
accumulating it in memory.

**How to tell it can go** Set `STORYBOOK_HEAP_MB=4096` and run the full suite
with coverage from the Testing panel. If it finishes, the ceilings can come out.

---

## 1b. Two upstream deprecation notices we cannot silence

**`vitest.init()` is deprecated. Use `vitest.standalone()` instead.**
Emitted by the addon's own code — `@storybook/addon-vitest@10.5.0`,
`dist/node/vitest.js:256`. Nothing in this repo calls it.

**"You can safely remove the setProjectAnnotations call from your setup file."**
We cannot; see entry 6. The notice is informational and there is no flag for it.

**How to tell they can go** Both should clear when addon-vitest updates.
Currently held at 10.5.0 by the 7-day release-age cap — see entry 3.

---

## 2. Story files run one at a time

**Workaround** `fileParallelism: false` on the `storybook` project in
`vitest.config.ts`. Costs roughly 20 seconds per run.

**Cause** Every story file shares ONE IndexedDB — the browser's, keyed by
origin, not per-worker state that Vitest's isolation can separate. A file
seeding fixtures runs alongside one wiping the database for a backup test, and
whichever asserts on row counts loses. Observed directly: three tests failed on
one run and passed the next with no code change.

**What would fix it** Namespacing the Dexie database per test file, so each gets
its own store. `db` is currently a module-level singleton, so this means
threading a name through `src/core/db` — worth doing if the suite grows enough
for the serial cost to bite.

**How to tell it can go** Flip it to `true` and run the suite five times. Any
failure that moves between runs means the contention is still there.

---

## 3. Storybook is pinned below the latest release

**Silenced by** `--no-version-updates` in `scripts/storybook-dev.mjs`.

**Cause** Storybook 10.5.2+ exists, but the global `~/.npmrc` sets
`min-release-age=7`, so npm refuses anything published in the last week. The
banner was advertising an upgrade npm will not install.

**Cost** A genuine upgrade notice would now also be hidden.

**How to tell it can go** `npm outdated` lists storybook. That means the newest
release has aged past the cap and can actually be installed — at which point
upgrade and consider removing the flag.

---

## 4. TypeScript is held at 6.x

**Cause** `typescript-eslint` declares `typescript >=4.8.4 <6.1.0`, verified
against its latest release. TypeScript 7 breaks linting entirely.

**Cost** No TS 7 features, and `npm outdated` permanently shows a row.

**How to tell it can go** `npm view typescript-eslint peerDependencies` accepts
`<7.x` or higher.

---

## 5. stylis is pinned to 4.2.0

**Cause** `@emotion/cache` depends on exactly `stylis@4.2.0`. Handing Emotion a
different copy crashes the RTL plugin on every `::placeholder` rule, which this
app has on every input.

**How to tell it can go** `@emotion/cache`'s own dependency moves.

---

## 6. The Storybook Vitest setup file is kept against the tool's advice

**Workaround** `.storybook/vitest.setup.ts` calls `setProjectAnnotations`, and
addon-vitest prints an info notice saying it can safely be removed.

**Cause** Following that advice hands setup to the addon's own
`setup-file-with-project-annotations.js`, which fails to import with
`SyntaxError: The requested module 'aria-query/lib/index.js' does not provide an
export named 'elementRoles'` — a CJS/ESM interop break in a transitive
dependency of addon-a11y. All story files fail to load. Verified by removing it
and watching the whole suite go red.

**How to tell it can go** Delete the file and run `npm run test:storybook`. If
it passes, the upstream break is fixed.

---

## 7. The PDF cannot lay out Persian correctly

**Not silenced — routed around.** `/certificate` renders the document as a page
and lets the browser print it. The one-click PDF button remains, with the
limitation documented at `src/shared/pdf/buildIncomeReport.ts`.

**Cause** pdfmake has no bidi implementation. It shapes Arabic-script glyphs but
does not reorder runs per visual line, so mixed Persian/Latin text and anything
that WRAPS can come out in the wrong word order. Reordering before handing the
string over does not help, because pdfmake line-breaks afterwards and bidi
ordering is per visual line.

**What would fix it** A PDF library with real UAX#9 support, or generating the
PDF from the print route via a headless browser — which needs a server, and this
app deliberately has none.

---

## 8. The MUI X date picker's sections have no accessible names

**Cause** `DateField` wraps its control in a `<label>`, so the composite field
is named — but MUI X renders each editable section as a span with no
`aria-label` of its own, so a screen reader announces the group rather than
"day", "month", "year".

**What would fix it** Upstream, or `localeText` overrides if MUI X exposes the
section labels there. Investigated but not resolved.

---

## 9. Accessibility checks are not enforced

**Status** `.storybook/preview.tsx` sets `a11y: { test: 'todo' }`, so
violations are reported but do not fail the run. A full run from the Testing
panel currently surfaces **103 findings** — real, and worth working through.

**What would fix it** Flip to `'error'` once the known violations are cleared,
so a regression fails CI rather than sitting in a panel nobody opens.

---

## 10. Two tests carry generous timeouts

**Where** `src/App.stories.tsx` (`LAZY_ROUTE`, 10 s) and
`src/shared/error-state/AppErrorFallback.stories.tsx` (10 s).

**Cause** Both wait on real work — resolving a lazy route across a suspense
boundary, and an export that validates every row in the shared database while
the rest of the suite runs. The default one-second window made them pass alone
and fail in a full run.

**Cost** A genuine hang in those paths takes ten seconds to report.

---

## 11. App route stories import their lazy chunks eagerly

**Workaround** `src/App.stories.tsx` imports every page module directly.

**Cause** Under the browser runner those chunks are fetched over HTTP at render
time, and that fetch failed intermittently — surfacing as
`Failed to fetch dynamically imported module`, and once React had torn down, as
a null `useContext`. Importing them puts them in the story's module graph so
`lazy()` resolves from the registry.

**Cost** Those stories no longer prove code-splitting works at runtime. The app
itself still splits; only the test stops depending on a live fetch.

---

## 12. The lingui rule carries an ignore list

**Where** `eslint.config.mjs`, `lingui/no-unlocalized-strings`.

**Cause** Without it the rule fires on Dexie index declarations, CSS values,
date-format patterns, locale tags and asset filenames — none of which are copy.
Each pattern is commented with what it covers.

**Cost** A real string matching one of those shapes would slip through. The
narrowest one to watch is the brand-constant list, which is a plain allowlist.

---

## 13. Scope deliberately cut

Listed in `PHASE-NEXT.md`, not here — those are decisions, not debt. The
notable one is that nothing can verify a certificate is authentic, which would
need a server-signed QR and therefore a backend.
