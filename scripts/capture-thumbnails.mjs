/**
 * Captures gallery thumbnails into public/thumbnails/<id>.png.
 *
 * Requires Playwright (not a project dependency):
 *   npm run build && npx vite preview --port 4173 &
 *   npx -y playwright@latest install chromium   # once
 *   node scripts/capture-thumbnails.mjs [baseUrl]
 */
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

const base = process.argv[2] ?? 'http://localhost:4173'
const ids = readdirSync(new URL('../src/watches', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })

for (const id of ids) {
  await page.goto(`${base}/#/watch/${id}?t=10:08:37&bare`)
  await page.waitForTimeout(3500)
  await page.screenshot({
    path: `public/thumbnails/${id}.png`,
    clip: { x: 150, y: 150, width: 600, height: 600 },
  })
  console.log('captured', id)
}

await browser.close()
