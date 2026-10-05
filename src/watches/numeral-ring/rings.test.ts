import { describe, expect, it } from 'vitest'
import { handAngles } from '../../utils/time'
import { ringRotations, worldAngle } from './rings'

const at = (hours: number, minutes: number, seconds = 0) =>
  ringRotations(handAngles({ hours, minutes, seconds, milliseconds: 0 }))

describe('fixed beam rings', () => {
  it('puts the current hour numeral under the beam', () => {
    const r = at(3, 0)
    expect(worldAngle(3 * 30, r.hour)).toBe(0)
  })

  it('puts the current minute mark under the beam', () => {
    const r = at(9, 40)
    expect(worldAngle(40 * 6, r.minute)).toBe(0)
  })

  it('places the beam half way between numerals at half past', () => {
    const r = at(7, 30)
    expect(worldAngle(7 * 30, r.hour)).toBe(345)
    expect(worldAngle(8 * 30, r.hour)).toBe(15)
  })
})
