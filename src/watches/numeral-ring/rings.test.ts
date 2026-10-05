import { describe, expect, it } from 'vitest'
import { ringRotations, worldAngle } from './rings'

const at = (hours: number, minutes: number, seconds = 0) =>
  ringRotations({ hours, minutes, seconds, milliseconds: 0 })

describe('fixed beam rings', () => {
  it('puts the current hour numeral under the beam', () => {
    expect(worldAngle(3 * 30, at(3, 0, 1).hour)).toBe(0)
  })

  it('keeps the hour centred for the whole hour (7:45 reads 7, not 8)', () => {
    expect(worldAngle(7 * 30, at(7, 45, 30).hour)).toBe(0)
  })

  it('puts the current minute mark under the beam', () => {
    expect(worldAngle(40 * 6, at(9, 40).minute)).toBe(0)
  })

  it('puts the current second mark under the beam', () => {
    expect(worldAngle(30 * 6, at(9, 40, 30).second)).toBe(0)
  })
})
