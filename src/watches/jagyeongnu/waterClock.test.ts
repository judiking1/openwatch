import { describe, expect, it } from 'vitest'
import { dropFall, gakClockTime, waterClock } from './waterClock'

const t = (hours: number, minutes: number, seconds = 0, milliseconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds,
})

describe('water clock', () => {
  it('fills through 진시 (07–09) and reads 45 minutes as the fourth 각', () => {
    const s = waterClock(t(7, 45))
    expect(s.sijin).toBe(4)
    expect(s.half).toBe('초')
    expect(s.progress).toBeCloseTo(0.375)
    expect(s.gak).toBe(3)
    expect(s.level).toBeCloseTo(0.375)
  })

  it('starts 자시 at 23:00 and 정 in the second hour', () => {
    expect(waterClock(t(23, 30)).sijin).toBe(0)
    expect(waterClock(t(0, 30)).half).toBe('정')
    expect(waterClock(t(22, 59, 59)).sijin).toBe(11)
  })

  it('siphons the vessel empty in the first seconds of a 시진', () => {
    const start = waterClock(t(9, 0, 0, 1))
    expect(start.flush).not.toBeNull()
    expect(start.level).toBeGreaterThan(0.99)
    const mid = waterClock(t(9, 0, 2))
    expect(mid.level).toBeCloseTo(0.5, 2)
    expect(waterClock(t(9, 0, 5)).flush).toBeNull()
  })

  it('never lets the level run backwards outside the flush', () => {
    let previous = -1
    for (let m = 0; m < 120; m += 7) {
      const level = waterClock(t(11 + Math.floor(m / 60), m % 60, 30)).level
      expect(level).toBeGreaterThan(previous)
      previous = level
    }
  })

  it('drops a drop once a second', () => {
    expect(dropFall(t(1, 0, 0, 0))).toBe(0)
    expect(dropFall(t(1, 0, 0, 900))).toBeNull()
  })

  it('labels the scale with the clock times of the current 시진', () => {
    expect(gakClockTime(5, 0)).toBe('9:00')
    expect(gakClockTime(5, 2)).toBe('9:30')
    expect(gakClockTime(5, 8)).toBe('11:00')
    expect(gakClockTime(0, 0)).toBe('23:00')
    expect(gakClockTime(0, 4)).toBe('0:00')
  })
})
