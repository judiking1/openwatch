import { describe, expect, it } from 'vitest'
import { dialPoint, formatClock, handAngles, type ClockTime } from './time'

const t = (hours: number, minutes = 0, seconds = 0, milliseconds = 0): ClockTime => ({
  hours,
  minutes,
  seconds,
  milliseconds,
})

describe('handAngles', () => {
  it('is zero at 12:00:00', () => {
    expect(handAngles(t(0))).toEqual({ hour: 0, minute: 0, second: 0 })
    expect(handAngles(t(12))).toEqual({ hour: 0, minute: 0, second: 0 })
  })

  it('places 3:00 at 90 degrees', () => {
    expect(handAngles(t(3)).hour).toBe(90)
    expect(handAngles(t(15)).hour).toBe(90)
  })

  it('sweeps the hour hand with minutes', () => {
    expect(handAngles(t(3, 30)).hour).toBe(105)
  })

  it('sweeps the minute hand with seconds', () => {
    expect(handAngles(t(0, 15, 30)).minute).toBe(93)
  })

  it('includes milliseconds in the second hand', () => {
    expect(handAngles(t(0, 0, 10, 500)).second).toBe(63)
  })

  it('stays below 360 degrees just before midnight', () => {
    const a = handAngles(t(23, 59, 59, 999))
    expect(a.hour).toBeLessThan(360)
    expect(a.minute).toBeLessThan(360)
    expect(a.second).toBeLessThan(360)
  })
})

describe('dialPoint', () => {
  it('maps 12, 3, 6 and 9 o’clock in y-down space', () => {
    const p = (deg: number) => {
      const { x, y } = dialPoint(10, deg)
      return [Math.round(x) + 0, Math.round(y) + 0]
    }
    expect(p(0)).toEqual([0, -10])
    expect(p(90)).toEqual([10, 0])
    expect(p(180)).toEqual([0, 10])
    expect(p(270)).toEqual([-10, 0])
  })
})

describe('formatClock', () => {
  it('zero-pads', () => {
    expect(formatClock(t(7, 5, 3))).toBe('07:05:03')
  })
})
