import { describe, expect, it } from 'vitest'
import {
  BLADE_RADIUS,
  bladeOutline,
  irisPose,
  minuteFromAperture,
  R_CLOSED,
  R_OPEN,
  ringRadius,
  SNAP_SECONDS,
} from './iris'

const t = (hours: number, minutes: number, seconds = 0, milliseconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds,
})

describe('iris', () => {
  it('closes steadily over the hour and reads back the minute', () => {
    expect(irisPose(t(3, 0, 1)).aperture).toBeCloseTo(ringRadius(1 / 60), 6)
    expect(irisPose(t(3, 30)).aperture).toBeCloseTo((R_OPEN + R_CLOSED) / 2, 6)
    expect(irisPose(t(3, 59, 59, 999)).aperture).toBeCloseTo(R_CLOSED, 2)
    expect(minuteFromAperture(irisPose(t(9, 41, 30)).aperture)).toBeCloseTo(41.5, 6)
  })

  it('snaps open at the top of the hour', () => {
    const start = irisPose(t(4, 0, 0))
    expect(start.snap).toBe(0)
    expect(start.aperture).toBeCloseTo(R_CLOSED, 6)
    const done = irisPose(t(4, 0, SNAP_SECONDS + 0.01))
    expect(done.snap).toBeNull()
    expect(done.aperture).toBeGreaterThan(R_OPEN - 0.1)
  })

  it('turns the carrier once in twelve hours, pointing at the hour', () => {
    expect(irisPose(t(0, 0, 30)).carrier).toBeCloseTo(360 * (0.5 / 60 / 12), 6)
    expect(irisPose(t(3, 0, 1)).carrier).toBeCloseTo(90, 1)
    expect(irisPose(t(15, 30)).carrier).toBeCloseTo(105, 6)
    expect(irisPose(t(10, 8, 15)).second).toBeCloseTo(90, 6)
  })

  it('draws each blade edge exactly at the aperture radius', () => {
    const out = bladeOutline(40, Math.PI / 3, 16, new Float32Array(34))
    const [x0, y0, x1, y1] = [out[0], out[1], out[32], out[33]]
    // The chord's midpoint lies on the blade normal at distance = aperture.
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    expect(Math.hypot(mx, my)).toBeCloseTo(40, 4)
    expect(Math.atan2(my, mx)).toBeCloseTo(Math.PI / 3, 4)
    // Every arc point is on the blade disc.
    for (let i = 0; i <= 16; i++) {
      expect(Math.hypot(out[i * 2], out[i * 2 + 1])).toBeCloseTo(BLADE_RADIUS, 4)
    }
  })
})
