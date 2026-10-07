#!/usr/bin/env node
/**
 * Scaffolds a concept from a spec: `npm run new-concept -- path/to/spec.json [--dry-run]`.
 * Writes src/watches/<id>/*, docs/concepts/<id>.md and registers it in the exhibition.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { register, scaffold } from './conceptScaffold.mjs'

const [specPath, flag] = process.argv.slice(2)
if (!specPath) {
  console.error('usage: npm run new-concept -- <spec.json> [--dry-run]')
  process.exit(1)
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const files = scaffold(spec)
const dry = flag === '--dry-run'

for (const [path, content] of Object.entries(files)) {
  if (existsSync(path)) {
    console.error(`refusing to overwrite ${path}`)
    process.exit(1)
  }
  if (dry) console.log(`would write ${path} (${content.length} bytes)`)
  else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
    console.log(`wrote ${path}`)
  }
}
const registry = 'src/watches/registry.ts'
const updated = register(readFileSync(registry, 'utf8'), spec.id)
if (dry) console.log(`would register ${spec.id} in ${registry}`)
else {
  writeFileSync(registry, updated)
  console.log(`registered ${spec.id} — now run: npx prettier --write src docs && npm test`)
}
