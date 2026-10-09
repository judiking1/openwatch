import { describe, expect, it } from 'vitest'
import { clockTime as t } from '../../utils/time'
import { dotCount, sketchIndicators, unitFraction } from './sketch'

describe('concept lab sketch', () => {
  it('maps each encoding variable to a primitive in its own band', () => {
    const list = sketchIndicators({
      encoding: {
        hour: { element: 'carrier', variable: 'angle' },
        minute: { element: 'aperture', variable: 'size' },
        second: { element: 'grains', variable: 'count' },
      },
    })
    expect(list.map((i) => i.kind)).toEqual(['hand', 'ring', 'dots'])
    expect(list[0].band[1]).toBeLessThan(list[1].band[0])
  })

  it('omits an unencoded second', () => {
    const list = sketchIndicators({
      encoding: {
        hour: { element: 'a', variable: 'relative angle' },
        minute: { element: 'b', variable: 'position' },
      },
    })
    expect(list.map((i) => i.kind)).toEqual(['pair', 'bead'])
  })

  it('runs each unit through its cycle', () => {
    expect(unitFraction('hour', t(15, 0))).toBeCloseTo(0.25)
    expect(unitFraction('minute', t(9, 45))).toBeCloseTo(0.75)
    expect(dotCount('hour', t(0, 5))).toBe(12)
    expect(dotCount('minute', t(4, 37))).toBe(3)
  })
})
