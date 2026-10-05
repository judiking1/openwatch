import { describe, expect, it } from 'vitest'
import { defaultOrbitalHandsLayout } from './config'
import { indicatorOutline, indicatorSize, orbitRadius } from './geometry'

describe('orbital hands geometry', () => {
  it('orders tracks hour < minute < second by default', () => {
    const l = defaultOrbitalHandsLayout
    expect(orbitRadius(l, 'hour')).toBeLessThan(orbitRadius(l, 'minute'))
    expect(orbitRadius(l, 'minute')).toBeLessThan(orbitRadius(l, 'second'))
  })

  it('keeps every indicator tip outside the numeral ring by default', () => {
    const l = defaultOrbitalHandsLayout
    for (const kind of ['hour', 'minute', 'second'] as const) {
      const tip = orbitRadius(l, kind) - indicatorSize(l, kind).length
      expect(tip).toBeGreaterThan(l.numeralRadius + 8)
    }
  })

  it('points the outline inward from the orbit', () => {
    const pts = indicatorOutline(80, 10, 4)
    const ys = pts.map(([, y]) => y)
    expect(Math.min(...ys)).toBe(-80)
    expect(Math.max(...ys)).toBe(-70)
  })
})
