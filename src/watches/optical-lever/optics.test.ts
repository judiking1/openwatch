import { describe, expect, it } from 'vitest'
import { dialVector, INCOMING, mirrorNormalAngle, reflect } from './optics'

describe('optical lever', () => {
  it('reflects the incoming beam to the requested dial angle', () => {
    for (const theta of [0, 30, 90, 135, 210, 300, 359]) {
      const out = reflect(INCOMING, dialVector(mirrorNormalAngle(theta)))
      const want = dialVector(theta)
      expect(out.x).toBeCloseTo(want.x, 9)
      expect(out.y).toBeCloseTo(want.y, 9)
    }
  })

  it('turns the mirror at half the beam speed', () => {
    expect(mirrorNormalAngle(120) - mirrorNormalAngle(0)).toBe(60)
  })
})
