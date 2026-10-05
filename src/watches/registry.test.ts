import { describe, expect, it } from 'vitest'
import { concepts, getConcept } from './registry'

describe('concept registry', () => {
  it('has unique ids and numbers', () => {
    const ids = concepts.map((c) => c.metadata.id)
    const numbers = concepts.map((c) => c.metadata.number)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('declares how to read every concept', () => {
    for (const c of concepts) {
      expect(c.metadata.howToRead.length).toBeGreaterThan(0)
      const td = c.metadata.timeDisplay
      expect(td.hour || td.minute || td.second).toBe(true)
    }
  })

  it('looks concepts up by id', () => {
    expect(getConcept('orbital-hands')?.metadata.name).toBe('Orbital Hands')
    expect(getConcept('nope')).toBeUndefined()
  })
})

describe('concept customization', () => {
  it('only exposes keys that exist in the default appearance', () => {
    for (const c of concepts) {
      for (const field of c.customization) {
        expect(c.defaultAppearance, `${c.metadata.id}.${field.key}`).toHaveProperty(field.key)
      }
    }
  })

  it('exposes at least three customisable properties per concept', () => {
    for (const c of concepts) expect(c.customization.length).toBeGreaterThanOrEqual(3)
  })
})
