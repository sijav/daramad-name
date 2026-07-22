import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

// Starts Storybook on the port the environment asks for.
//
// `storybook dev` reads `--port` and `SBCONFIG_PORT` but NOT `PORT`, so a
// harness that assigns a free port through `PORT` is ignored and Storybook
// takes 6006 regardless — which fails outright when something already holds it.
// (Upstream: storybookjs/storybook#35257.)
//
// A wrapper rather than an inline `SBCONFIG_PORT=$PORT` prefix, because npm
// scripts run through cmd.exe on Windows, where that syntax is a parse error.

const require = createRequire(import.meta.url)

// Run Storybook's own entry under THIS node rather than spawning the
// `storybook` shim through a shell. Node deprecated passing args alongside
// `shell: true` (DEP0190) because they are concatenated into the command line
// instead of escaped; going straight to the entry removes the shell entirely.
//
// The path comes from the package's own `bin` field. Resolving the file
// directly is not possible — Storybook's `exports` map does not expose it, and
// `require.resolve` refuses any subpath the map omits.
const manifestPath = require.resolve('storybook/package.json')
const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entry = resolve(dirname(manifestPath), typeof bin === 'string' ? bin : bin.storybook)

const port = process.env.PORT || process.env.SBCONFIG_PORT || '6006'
// `--no-version-updates` because the nag is noise we cannot act on: newer
// Storybook releases are held back by the 7-day release-age cap in the user's
// npmrc, so the banner would advertise an upgrade npm refuses to install.
const child = spawn(process.execPath, [entry, 'dev', '--port', port, '--no-version-updates', ...process.argv.slice(2)], {
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0))
})
