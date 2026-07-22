import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

// Runs Vitest with a raised heap ceiling.
//
// Node's default is ~4.2 GB, and the coverage run has crashed at ~4.09 GB with
// `FATAL ERROR: Reached heap limit`. The stack pointed at
// `v8::ValueDeserializer::ReadValue` — the host deserialising coverage payloads
// sent back from the workers, which Vitest holds in the main process for the
// whole run (vitest-dev/vitest#4476).
//
// SEE TECH-DEBT.md — this is a mitigation, not a fix. The upstream issue is
// that coverage is accumulated in memory rather than streamed to disk. Raising
// the ceiling buys room; it does not stop the growth.

const require = createRequire(import.meta.url)

// Vitest's `exports` map does not expose its bin, so the path comes from the
// package's own `bin` field — the same reason `scripts/storybook-dev.mjs` reads
// the manifest instead of resolving the file.
const manifestPath = require.resolve('vitest/package.json')
const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entry = resolve(dirname(manifestPath), typeof bin === 'string' ? bin : bin.vitest)

const heapMb = process.env.VITEST_HEAP_MB || '20480'
const child = spawn(process.execPath, [`--max-old-space-size=${heapMb}`, entry, ...process.argv.slice(2)], { stdio: 'inherit' })

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0))
})
