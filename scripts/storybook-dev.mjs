import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

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

// Resolve Storybook's own JS entry and run it under THIS node, rather than
// spawning the `storybook` shim through a shell. Node 22 deprecated passing
// args alongside `shell: true` (DEP0190) because they are concatenated into the
// command line rather than escaped. Going straight to the entry point removes
// the shell entirely — which also drops a layer of process on every start.
const dispatcher = require.resolve('storybook/bin/dispatcher.js')

const port = process.env.PORT || process.env.SBCONFIG_PORT || '6006'
const child = spawn(process.execPath, [dispatcher, 'dev', '--port', port, ...process.argv.slice(2)], { stdio: 'inherit' })

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0))
})
