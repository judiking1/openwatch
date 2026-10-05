import { describe, expect, it } from 'vitest'
import { readShears, SECONDS_TRACK, shearsPose } from './shears'

const t = (hours: number, minutes: number, seconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds: 0,
})

describe('shears', () => {
  it('is closed and points at the hour on the hour', () => {
    const p = shearsPose(t(3, 0))
    expect(p.opening).toBe(0)
    expect(p.bladeA).toBe(90)
    expect(p.bladeB).toBe(90)
  })

  it('opens 3° per minute, symmetric around the hour bisector', () => {
    const p = shearsPose(t(7, 40))
    expect(p.opening).toBe(120)
    expect(p.bisector).toBe(230)
    expect(p.bladeB - p.bisector).toBe(p.bisector - p.bladeA)
  })

  it('reads back hours and minutes from the two blade angles alone', () => {
    for (const [h, m] of [
      [1, 5],
      [7, 45],
      [11, 59],
      [12, 30],
    ]) {
      const r = readShears(shearsPose(t(h, m)))
      expect(Math.floor(r.hours + 1e-9)).toBe(h % 12)
      expect(r.minutes).toBeCloseTo(m, 6)
    }
  })

  it('slides the seconds bead along the handles once a minute', () => {
    expect(shearsPose(t(1, 0, 0)).secondRadius).toBe(SECONDS_TRACK.inner)
    expect(shearsPose(t(1, 0, 30)).secondRadius).toBe(
      (SECONDS_TRACK.inner + SECONDS_TRACK.outer) / 2,
    )
  })
})
