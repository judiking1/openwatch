import { describe, expect, it } from 'vitest'
import spec from '../docs/concept-generator/example-spec.json'
// @ts-expect-error — plain ESM script without type declarations
import { register, scaffold, validateSpec } from './conceptScaffold.mjs'

describe('concept scaffold', () => {
  it('accepts the example spec and rejects broken ones', () => {
    expect(validateSpec(spec)).toEqual([])
    const broken = { ...spec, id: 'Bad Id', readingHint: 'x'.repeat(200) }
    expect(validateSpec(broken).length).toBeGreaterThanOrEqual(2)
    const copy = { ...spec, precedents: [{ name: 'Same thing', verdict: 'same' }] }
    expect(validateSpec(copy).join()).toMatch(/already exists/)
  })

  it('writes the concept files and registers it', () => {
    const files = scaffold({ ...spec, id: 'demo-watch' }, '2026-10-08') as Record<string, string>
    expect(Object.keys(files).sort()).toEqual([
      'docs/concepts/demo-watch.md',
      'src/watches/demo-watch/DemoWatchWatch.tsx',
      'src/watches/demo-watch/appearance.ts',
      'src/watches/demo-watch/demo-watch.test.ts',
      'src/watches/demo-watch/demo-watch.ts',
      'src/watches/demo-watch/index.ts',
      'src/watches/demo-watch/metadata.ts',
    ])
    expect(files['src/watches/demo-watch/metadata.ts']).toContain('id: "demo-watch"')
    expect(files['src/watches/demo-watch/appearance.ts']).toContain('bladeColor: "#3a3e46"')
    const registry =
      "import type { WatchConcept } from '../types/watch'\nexport const concepts = [\n  iris,\n]\n"
    const updated = register(registry, 'demo-watch')
    expect(updated).toContain("import { demoWatch } from './demo-watch'")
    expect(updated).toContain('  iris,\n  demoWatch,\n]')
    expect(register(updated, 'demo-watch')).toBe(updated)
  })
})
