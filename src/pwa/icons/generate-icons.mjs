import { info } from 'node:console'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

// Rasterises the three authored SVGs in this folder into the PNG icons the
// manifest and iOS ask for. Run with `npm run pwa:icons` after editing an SVG;
// the PNGs are committed, so a normal build does not need sharp.
//
// Deliberately not `@vite-pwa/assets-generator`: it derives every size from one
// square source, which cannot express the three different framings these icons
// need, rounded for `any`, edge-to-edge with a shrunken glyph for `maskable`,
// edge-to-edge at full size for iOS.
//
// No `process` and no bare `console` in this file: eslint lints `.mjs` under
// `js.configs.recommended` with no Node globals declared, so both would be
// `no-undef` errors.

const iconsDir = import.meta.dirname
const publicDir = join(iconsDir, '..', '..', '..', 'public')

/** @type {{ source: string, output: string, size: number }[]} */
const targets = [
  { source: 'icon.svg', output: 'pwa-192x192.png', size: 192 },
  { source: 'icon.svg', output: 'pwa-512x512.png', size: 512 },
  { source: 'icon-maskable.svg', output: 'pwa-maskable-192x192.png', size: 192 },
  { source: 'icon-maskable.svg', output: 'pwa-maskable-512x512.png', size: 512 },
  { source: 'icon-apple.svg', output: 'apple-touch-icon.png', size: 180 },
]

await mkdir(publicDir, { recursive: true })

// `favicon.svg` is the `any` icon served as-is: a vector favicon stays crisp at
// every tab size and costs a few hundred bytes.
await writeFile(join(publicDir, 'favicon.svg'), await readFile(join(iconsDir, 'icon.svg')))
info('public/favicon.svg')

for (const { source, output, size } of targets) {
  const png = await sharp(join(iconsDir, source), { density: 512 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(join(publicDir, output), png)
  info(`public/${output} (${size}x${size}, ${png.byteLength} bytes)`)
}
