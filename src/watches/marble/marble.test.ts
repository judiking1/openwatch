import { describe, expect, it } from 'vitest'
import { angleDelta } from '../../utils/time'
import { advanceMarble } from './marble'

describe('marble', () => {
  it('settles at the low point of the dish', () => {
    const s = advanceMarble({ angle: 0, velocity: 0 }, 225, 12)
    expect(Math.abs(angleDelta(s.angle, 225))).toBeLessThan(0.5)
    expect(Math.abs(s.velocity)).toBeLessThan(1)
  })

  it('takes the short way round across 12 o’clock', () => {
    let s = { angle: 350, velocity: 0 }
    s = advanceMarble(s, 10, 0.2)
    expect(angleDelta(s.angle, 350)).toBeGreaterThan(0)
  })

  it('stays put when already at rest at the low point', () => {
    const s = advanceMarble({ angle: 90, velocity: 0 }, 90, 5)
    expect(s.angle).toBeCloseTo(90, 6)
  })
})
