import { describe, expect, it } from 'vitest'
import { clockTime as t } from '../../utils/time'
import { CIPHER, cipherValues, ringTargets, shortestDelta, slotAngle } from './cipher'

/** Glyph index visible on ring `b` at dial angle `angle` given ring rotation `rot`. */
function glyphAt(groupIndex: number, b: number, rot: number, angle: number) {
  const g = CIPHER[groupIndex]
  const n = g.glyphs.length
  const slot = Math.round(((((angle - rot) % 360) + 360) % 360) / (360 / n)) % n
  return g.permutations[b][slot]
}

describe('cipher', () => {
  it('uses true permutations', () => {
    for (const g of CIPHER) {
      for (const p of g.permutations) {
        expect([...p].sort((a, b) => a - b)).toEqual([...g.glyphs.keys()])
      }
    }
  })

  it('maps clock time to glyph indices', () => {
    expect(cipherValues(t(7, 45))).toEqual({ hour: 6, tens: 4, units: 5 })
    expect(cipherValues(t(0, 5))).toEqual({ hour: 11, tens: 0, units: 5 })
  })

  it('aligns all three bands of the right glyph in the window', () => {
    for (const [h, m] of [
      [7, 45],
      [12, 0],
      [3, 59],
    ]) {
      const v = cipherValues(t(h, m))
      CIPHER.forEach((g, gi) => {
        const rot = ringTargets(g, v[g.id])
        for (let b = 0; b < 3; b++) expect(glyphAt(gi, b, rot[b], 0)).toBe(v[g.id])
      })
    }
  })

  it('never aligns a whole glyph anywhere but the window', () => {
    CIPHER.forEach((g, gi) => {
      for (let value = 0; value < g.glyphs.length; value++) {
        const rot = ringTargets(g, value)
        for (let slot = 1; slot < g.glyphs.length; slot++) {
          const angle = slotAngle(g, slot)
          const seen = [0, 1, 2].map((b) => glyphAt(gi, b, rot[b], angle))
          expect(new Set(seen).size, `${g.id} value ${value} slot ${slot}`).toBeGreaterThan(1)
        }
      }
    })
  })

  it('covers each glyph with three contiguous bands', () => {
    for (const g of CIPHER) {
      expect(g.bands[0].inner).toBe(g.bands[1].outer)
      expect(g.bands[1].inner).toBe(g.bands[2].outer)
      expect(g.bands[0].outer - g.centre).toBeGreaterThan(g.fontSize * 0.4)
      expect(g.centre - g.bands[2].inner).toBeGreaterThan(g.fontSize * 0.4)
    }
  })

  it('steps rings along the shortest path', () => {
    expect(shortestDelta(-330, 0)).toBe(-30)
    expect(shortestDelta(0, 90)).toBe(90)
    expect(shortestDelta(170, -170)).toBe(20)
  })
})
