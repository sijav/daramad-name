# Technical debt

Every warning that is silenced, every workaround, and every version held back is
written down here, with what it costs, what would actually fix it, and how to
tell when it can go.

**Rule: nothing gets suppressed without an entry in this file.** A silenced
warning with no record is a decision nobody can revisit, and the reason it was
silenced is exactly what is lost first.

Ordered by how much it would hurt to leave forever.

---

## When to check for updates again

Sina's global `~/.npmrc` sets `min-release-age=7`, so npm refuses anything
published in the last seven days. That is deliberate supply-chain protection,
not a bug, and it means some updates are not blocked by us at all, they are
simply not old enough yet.

Checked 2026-07-23. Run `npm outdated` and `npm audit` again on or after each
date below; if the package has moved on since, recompute from its own publish
date rather than trusting this table.

| Package                                   | Want   | Published  | Installable from | Why                                                     |
| ----------------------------------------- | ------ | ---------- | ---------------- | ------------------------------------------------------- |
| `fast-uri`                                | 3.1.4  | 2026-07-19 | **2026-07-26**   | The one high-severity advisory, GHSA-v2hh-gcrm-f6hx     |
| `storybook` and `@storybook/addon-vitest` | 10.5.3 | 2026-07-20 | **2026-07-27**   | Clears entry 3's banner, and possibly entry 1b's notice |

Two others are held back by something other than age, so no date applies:
`typescript` waits on typescript-eslint's peer range (entry 4) and `stylis`
waits on `@emotion/cache`'s exact pin (entry 5). Check those with the commands
in their own entries, not with the calendar.

To take an update once its date has passed:

```bash
npm outdated          # what moved
npm update            # everything inside the semver ranges
npm audit fix         # advisories that do not need a major bump
npm run lint && npm run lint:tsc && npm test && npm run build
```

---

## 1. Test runs exhaust the heap, so both hosts run with a raised ceiling

**Mitigated by** `scripts/vitest.mjs` and `scripts/storybook-dev.mjs`, which
both raise Node's heap ceiling to 20 GB (`VITEST_HEAP_MB` /
`STORYBOOK_HEAP_MB` override it).

**Symptom** `FATAL ERROR: Ineffective mark-compacts near heap limit` at
~4.09 GB, with `v8::ValueDeserializer::ReadValue` in the native stack. From the
Storybook Testing panel it presents as **"Connection lost"** partway through,
observed stopping at 66/252 and 113/252, because the process being killed IS
the Storybook dev server.

**Cause** Vitest holds coverage reports in the main process for the whole run
rather than streaming them to disk
([vitest-dev/vitest#4476](https://github.com/vitest-dev/vitest/issues/4476)).
The Vitest addon runs the browser suite INSIDE the Storybook dev server, so that
process carries it. Node's default ceiling is 4288 MB.

**Measured** Baseline Storybook host 400 MB. A full run from the Testing panel
with Interactions + Coverage + Accessibility enabled peaks at **7908 MB**,
roughly 20x baseline, and nearly double the default ceiling. With the ceiling
raised the same run completes: 252 tests, 89% coverage, 103 accessibility
findings.

**Cheaper alternative** Unticking **Coverage** in the Testing panel removes most
of the growth. Worth doing when only interaction or a11y results are wanted.

**What would fix it** Upstream streaming coverage to disk instead of
accumulating it in memory.

**How to tell it can go** Set `STORYBOOK_HEAP_MB=4096` and run the full suite
with coverage from the Testing panel. If it finishes, the ceilings can come out.

**Last checked 2026-07-23, half of it** `VITEST_HEAP_MB=4096 npm run
test:coverage` now finishes: 82 files, 633 tests, 94% lines, no heap error. That
is the CLI host, so it clears `scripts/vitest.mjs` but says nothing about
`scripts/storybook-dev.mjs`, which is the process this entry is really about:
the addon runs the browser suite INSIDE the Storybook dev server, and that host
was never exercised here. Drive a run from the Testing panel with the lower
ceiling before removing either.

---

## 1b. One upstream deprecation notice we cannot silence

**`vitest.init()` is deprecated. Use `vitest.standalone()` instead.**
Emitted by the addon's own code, `@storybook/addon-vitest@10.5.0`,
`dist/node/vitest.js:256`. Nothing in this repo calls it.

**How to tell it can go** It should clear when addon-vitest updates. Currently
held at 10.5.0 by the 7-day release-age cap, see entry 3.

The second notice this entry used to carry, "You can safely remove the
setProjectAnnotations call", is gone: the advice turned out to be correct once
the upstream `aria-query` interop break was fixed, and the setup file was
deleted on 2026-07-23.

---

## 2. Story files run one at a time

**Workaround** `fileParallelism: false` on the `storybook` project in
`vitest.config.ts`. Costs roughly 20 seconds per run.

**Cause** Every story file shares ONE IndexedDB, the browser's, keyed by
origin, not per-worker state that Vitest's isolation can separate. A file
seeding fixtures runs alongside one wiping the database for a backup test, and
whichever asserts on row counts loses. Observed directly: three tests failed on
one run and passed the next with no code change.

**What would fix it** Namespacing the Dexie database per test file, so each gets
its own store. `db` is currently a module-level singleton, so this means
threading a name through `src/core/db`, worth doing if the suite grows enough
for the serial cost to bite.

**How to tell it can go** Flip it to `true` and run the suite five times. Any
failure that moves between runs means the contention is still there.

**Last checked 2026-07-23** Still there. Parallel finishes in 34s against 62s
serial, so the prize is real, but one of five runs failed and the other four
passed with no code change. That was after `seedDatabase` was made
concurrency-safe (shared in-flight seed, ref-counted teardown, `bulkPut`), which
fixed the `ConstraintError` on Docs pages but not this: seeding is only one of
the writers, and a file that CLEARS the database still races a file that reads
it. Namespacing per file is the fix, not more locking around the seed.

---

## 3. Storybook is pinned below the latest release

**Silenced by** `--no-version-updates` in `scripts/storybook-dev.mjs`.

**Cause** Storybook 10.5.2+ exists, but the global `~/.npmrc` sets
`min-release-age=7`, so npm refuses anything published in the last week. The
banner was advertising an upgrade npm will not install.

**Cost** A genuine upgrade notice would now also be hidden.

**How to tell it can go** `npm outdated` lists storybook. That means the newest
release has aged past the cap and can actually be installed, at which point
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

## 6. The one-click Persian PDF, fixed, and what the fix costs

**Status** RESOLVED. The period line now reads `۱ فروردین ۱۴۰۵ - ۱ مرداد ۱۴۰۵`,
digits intact, in the file the Report page downloads.

**What was wrong** pdfmake → pdfkit → fontkit handed a whole line to fontkit's
`layout`, which reverses an RTL run as one blob. Persian digits (U+06F0 to 06F9)
are bidi class EN, a number run that stays LEFT-TO-RIGHT inside RTL text, so
reversing the whole line turned «۱۴۰۵» into «۵۰۴۱». That is over-reversal, not
absent bidi. Every JS PDF engine tried failed it identically: pdfmake/fontkit,
and `pdfnative`, whose own bidi reversed the digits too (and mis-shaped the
letters). The browser gets it right, which is why `/certificate` always worked.

**The fix** `src/shared/pdf/bidiText.ts` runs real UAX#9 bidi (`bidi-js`) FIRST,
splitting each line into maximal same-direction runs. Each run is then
pure-direction, so fontkit's own reversal is exactly right for it, an RTL word
reverses, a digit run does not, and the shaped runs are concatenated in visual
order. It is installed by patching fontkit's `layout`, the one choke point every
pdfkit text call flows through. The PDF is drawn with pdfkit (replacing
pdfmake), from the SAME `CertificateModel` the on-screen certificate uses, so
the two cannot drift. Verified by `bidiText.test.ts` (the ۱۴۰۵ regression),
`renderCertificatePdf.test.ts` (a valid, font-embedded, selectable PDF for both
languages), and by hand in the dev server (a 42 KB selectable PDF).

There is deliberately NO automated browser test for the download: pdfkit needs
Buffer/stream/zlib/fs, and the polyfill plugin that supplies them in the dev
server also rewrites Storybook's own `node:fs` imports and breaks the vitest
browser runner. The Node tests exercise the identical `renderCertificatePdf` +
`bidiText` code the browser runs, so the gap is the browser SHIMS, not the
rendering, and those are proven by the manual download working.

The residual debt below is the price of drawing PDFs with a Node library in the
browser. It is small, but it is real.

### 7a. pdfkit needs Node built-ins polyfilled in the browser

**Workaround** `vite.config.ts` adds `vite-plugin-node-polyfills` for `buffer`,
`stream`, `zlib`, `util`, `events`, `string_decoder` and `fs`, plus the `Buffer`
/ `global` / `process` globals. pdfkit assumes all of these exist. The report
path is dynamically imported, so they stay out of the initial bundle, and the
Node unit project uses its own `vitest.config` and keeps the REAL modules.

**Cost** A whole-app polyfill layer, and ~700 KB of pdfkit + fontkit in the
report chunk.

**How to tell it can go** pdfkit ships a browser build that does not reach for
Node built-ins, or a maintained pure-browser PDF engine gains correct bidi.

### 7b. The default font is switched off to avoid an `fs` read

**Workaround** `renderCertificatePdf` passes `font: false` to the pdfkit
constructor.

**Cause** pdfkit otherwise loads Helvetica's AFM metrics with
`fs.readFileSync` in its constructor, which has no file to read in the browser
and throws `Cannot read properties of null (reading 'readFileSync')`. We only
ever use the embedded Vazirmatn, set before every draw, so no built-in font is
needed.

**How to tell it can go** It does not need to; it is the correct setting. Noted
because it looks odd without the reason.

### 7c. The PDF is emitted uncompressed

**Workaround** `renderCertificatePdf` passes `compress: false`.

**Cause** pdfkit's compression path calls Node's `zlib.deflateSync`, which the
browser zlib shim does not implement. pdfkit still SUBSETS the embedded font, so
an uncompressed certificate is ~42 KB, small enough to leave.

**What would fix it** A browser `deflateSync` (e.g. wiring `fflate` into the
zlib shim), then `compress: true`. Worth it only if the file size ever matters.

**How to tell it can go** Flip `compress` to `true` and download a certificate.
If it opens, the shim now provides a working `deflateSync`.

---

## 7. One axe rule is switched off, on the chart stories only

**Status** Accessibility is now ENFORCED, `.storybook/preview.tsx` sets
`a11y: { test: 'error' }`, so any violation fails the run. The suite is at zero.
It was at 103 findings.

**The exception** `role-img-alt` is disabled in five story files, all of which
render a MUI X chart, via `parameters.a11y.config.rules`. Nowhere else, and no
other rule anywhere.

**Cause, and it is upstream** MUI X renders `ChartsAccessibilityProxy`
(`@mui/x-charts/internals/components/ChartsAccessibilityProxy`). It creates two
`role="img"` divs pointing at `voiceover-<chartId>-1|2` elements which the
library creates EMPTY and fills only while the chart has keyboard focus. It is a
live region for keyboard navigation, not a static image label, so at rest axe
correctly sees `role="img"` with an empty accessible name, on every chart, in
every story. 18 findings, one cause.

**Why it is not fixed instead** The only two routes are passing
`disableKeyboardNavigation`, which removes a real accessibility feature to
satisfy a checker, or writing into MUI X's internal divs. Both are worse than
the finding.

**How to tell it can go** Delete the `CHART_A11Y` constant from the five story
files and run `npm run test:storybook`. If it passes, MUI X now gives the proxy
a name at rest.

---

## 8. Two tests carry generous timeouts

**Where** `src/App.stories.tsx` (`LAZY_ROUTE`, 10 s) and
`src/shared/error-state/AppErrorFallback.stories.tsx` (10 s).

**Cause** Both wait on real work, resolving a lazy route across a suspense
boundary, and an export that validates every row in the shared database while
the rest of the suite runs. The default one-second window made them pass alone
and fail in a full run.

**Cost** A genuine hang in those paths takes ten seconds to report.

---

## 9. The lingui rule carries an ignore list

**Where** `eslint.config.mjs`, `lingui/no-unlocalized-strings`.

**Cause** Without it the rule fires on Dexie index declarations, CSS values,
date-format patterns, locale tags and asset filenames, none of which are copy.
Each pattern is commented with what it covers.

**Cost** A real string matching one of those shapes would slip through. The
narrowest one to watch is the brand-constant list, which is a plain allowlist.

---

## 10. Scope deliberately cut

Listed in `PHASE-NEXT.md`, not here, those are decisions, not debt. The
notable one is that nothing can verify a certificate is authentic, which would
need a server-signed QR and therefore a backend.
