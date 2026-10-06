import { describe, expect, it } from 'vitest'
import { jumpHourAngle } from '../../utils/time'
import { lensScale, swell } from './lens'

const t = (hours: number, minutes: number) => ({ hours, minutes, seconds: 0, milliseconds: 0 })

describe('lens', () => {
  it('is strongest at the focus and fades with distance', () => {
    expect(swell(90, 90, 10)).toBe(1)
    expect(swell(100, 90, 10)).toBeCloseTo(Math.exp(-1))
    expect(swell(0, 359, 10)).toBeGreaterThan(swell(10, 359, 10))
  })

  it('makes the current hour the single largest numeral (7:45 → 7)', () => {
    const focus = jumpHourAngle(t(7, 45))
    const sizes = Array.from({ length: 12 }, (_, i) => lensScale('hour', i * 30, focus))
    const largest = sizes.indexOf(Math.max(...sizes))
    expect(largest).toBe(7)
    expect(sizes.filter((s) => s === sizes[7])).toHaveLength(1)
  })

  it('makes the current minute bar the tallest', () => {
    const sizes = Array.from({ length: 60 }, (_, i) => lensScale('minute', i * 6, 45 * 6))
    expect(sizes.indexOf(Math.max(...sizes))).toBe(45)
  })
})
