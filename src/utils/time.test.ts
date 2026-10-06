import { describe, expect, it } from 'vitest'
import {
  atTimeOfDay,
  clockTimeFromMs,
  dialPoint,
  formatClock,
  handAngles,
  jumpHourAngle,
  parseClock,
  secondsOfDay,
  type ClockTime,
} from './time'

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

describe('jumpHourAngle', () => {
  it('holds the whole hour for the full hour', () => {
    expect(jumpHourAngle(t(7, 0, 1))).toBe(210)
    expect(jumpHourAngle(t(7, 45, 30))).toBe(210)
    expect(jumpHourAngle(t(7, 59, 59, 999))).toBe(210)
  })

  it('eases from the previous hour right after the hour', () => {
    expect(jumpHourAngle(t(8, 0, 0, 0))).toBe(210)
    expect(jumpHourAngle(t(8, 0, 0, 300))).toBe(225)
    expect(jumpHourAngle(t(8, 0, 0, 600))).toBe(240)
  })

  it('handles midnight and noon', () => {
    expect(jumpHourAngle(t(0, 30))).toBe(0)
    expect(jumpHourAngle(t(12, 30))).toBe(0)
  })
})

describe('parseClock', () => {
  it('parses H:MM and HH:MM:SS', () => {
    expect(parseClock('7:45')).toEqual({ hours: 7, minutes: 45, seconds: 0 })
    expect(parseClock('23:59:59')).toEqual({ hours: 23, minutes: 59, seconds: 59 })
  })

  it('rejects malformed or out-of-range values', () => {
    for (const bad of ['', '24:00', '7:60', '7:5', 'noon', '12:00:61']) {
      expect(parseClock(bad), bad).toBeNull()
    }
  })
})

describe('atTimeOfDay / secondsOfDay', () => {
  it('round-trips a time of day', () => {
    const ms = atTimeOfDay(Date.now(), 7, 45, 30)
    expect(secondsOfDay(clockTimeFromMs(ms))).toBe(7 * 3600 + 45 * 60 + 30)
  })
})
