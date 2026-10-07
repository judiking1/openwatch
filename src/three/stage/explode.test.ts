import { describe, expect, it } from 'vitest'
import { approach, EXPLODE_LIFT, explodeLift } from './explode'

describe('exploded view', () => {
  it('uses an explicit userData.explode lift first', () => {
    expect(explodeLift({ name: 'hour', userData: { explode: 12 } })).toBe(12)
  })

  it('finds the hands by their conventional names', () => {
    expect(explodeLift({ name: 'minute', userData: {} })).toBe(EXPLODE_LIFT.minute)
    expect(explodeLift({ name: 'dial', userData: {} })).toBeNull()
  })

  it('stacks the layers in assembly order', () => {
    const { crystal, bezel, second, minute, hour, caseback } = EXPLODE_LIFT
    expect(crystal).toBeGreaterThan(bezel)
    expect(bezel).toBeGreaterThan(second)
    expect(second).toBeGreaterThan(minute)
    expect(minute).toBeGreaterThan(hour)
    expect(caseback).toBeLessThan(0)
  })

  it('approaches the target without overshooting', () => {
    let v = 0
    for (let i = 0; i < 120; i++) v = approach(v, 1, 1 / 60)
    expect(v).toBeGreaterThan(0.99)
    expect(v).toBeLessThanOrEqual(1)
  })
})
