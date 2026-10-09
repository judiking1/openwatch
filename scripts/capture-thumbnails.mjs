/**
 * Captures gallery thumbnails into public/thumbnails/<id>.png.
 *
 * Requires Playwright (not a project dependency):
 *   npm run build && npx vite preview --port 4173 &
 *   npx -y playwright@latest install chromium   # once
 *   node scripts/capture-thumbnails.mjs [baseUrl] [id …]
 */
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

const base = process.argv[2] ?? 'http://localhost:4173'
const all = readdirSync(new URL('../src/watches', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
// Optional ids after the base URL capture only those watches.
const only = process.argv.slice(3)
const ids = only.length ? all.filter((id) => only.includes(id)) : all

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })

// Watches that simulate from rest need longer before their figure has formed (headless
// software rendering runs at a few frames per second).
const SETTLE_MS = { phase: 40000 }

for (const id of ids) {
  await page.goto(`${base}/#/watch/${id}?t=10:08:37&bare`)
  // Wait until the canvas has painted, then let heavy scenes (textures, fluid) settle.
  await page.waitForSelector('canvas')
  await page.waitForTimeout(SETTLE_MS[id] ?? 7000)
  await page.screenshot({
    path: `public/thumbnails/${id}.png`,
    clip: { x: 150, y: 150, width: 600, height: 600 },
  })
  console.log('captured', id)
}

await browser.close()
