import { describe, expect, it } from 'vitest'
import { buildPrompt, nextConceptNumber, parseSpecText, promptTemplate } from './prompt'

const doc =
  'intro\n```text\nIdea: {IDEA, e.g. "x"}.\nSchema: {PASTE concept-spec.schema.json}\nNext: {e.g. 014}. Today: {YYYY-MM-DD}.\n```\nmore'

describe('concept lab prompt', () => {
  it('extracts the template from the kit document', () => {
    expect(promptTemplate(doc)).toMatch(/^Idea:/)
  })

  it('fills the idea, schema, number and date', () => {
    const prompt = buildPrompt('tides', '014', '2026-10-08', doc)
    expect(prompt).toContain('Idea: tides.')
    expect(prompt).toContain('"title": "Orbital Watch Lab concept spec"')
    expect(prompt).toContain('Next: 014. Today: 2026-10-08.')
  })

  it('numbers the next concept after the highest', () => {
    expect(nextConceptNumber(['001', '013', '012'])).toBe('014')
  })

  it('parses pasted JSON with or without fences', () => {
    expect(parseSpecText('Here:\n```json\n{"id": "a"}\n```')).toEqual({ id: 'a' })
    expect(parseSpecText('sure! {"id": "b"} hope it helps')).toEqual({ id: 'b' })
    expect(() => parseSpecText('no json')).toThrow()
  })
})
