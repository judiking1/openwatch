import { describe, expect, it } from 'vitest'
import {
  AFTERGLOW,
  BINS,
  charge,
  CORE_RADIUS,
  createBand,
  decay,
  filamentPath,
  FILAMENTS,
  gaussian,
  peakAngle,
  plasmaPose,
  random,
  steadyPeak,
  stepBand,
  WANDER,
  wander,
} from './plasma'

const t = (hours: number, minutes: number, seconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds: 0,
})

const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

describe('plasma', () => {
  it('draws the filaments to the hour and minute', () => {
    expect(plasmaPose(t(3, 0))).toEqual({ hour: 90, minute: 0 })
    const p = plasmaPose(t(15, 40, 30))
    expect(p.hour).toBeCloseTo(110.25, 6)
    expect(p.minute).toBeCloseTo(243, 6)
  })

  it('wanders with the stated spread around the time', () => {
    const rand = random(7)
    const offsets = new Float64Array(1)
    let sum = 0
    let sq = 0
    const n = 20000
    for (let i = 0; i < n; i++) {
      wander(offsets, 20, 1 / 30, rand)
      sum += offsets[0]
      sq += offsets[0] ** 2
    }
    expect(Math.abs(sum / n)).toBeLessThan(2)
    expect(Math.sqrt(sq / n)).toBeGreaterThan(17)
    expect(Math.sqrt(sq / n)).toBeLessThan(23)
  })

  it('gaussian samples have unit variance', () => {
    const rand = random(3)
    let sq = 0
    for (let i = 0; i < 10000; i++) sq += gaussian(rand) ** 2
    expect(sq / 10000).toBeCloseTo(1, 1)
  })

  it('charges a spot that wraps across 12 o’clock and decays with the afterglow', () => {
    const bins = new Float32Array(BINS)
    charge(bins, 359.5, 1)
    expect(bins[0]).toBeGreaterThan(0.9)
    expect(bins[BINS - 1]).toBeGreaterThan(0.9)
    expect(peakAngle(bins)).toBeGreaterThan(358)
    const before = bins[0]
    decay(bins, AFTERGLOW)
    expect(bins[0] / before).toBeCloseTo(Math.exp(-1), 5)
  })

  it('reads the time from the glow, not from any one filament', () => {
    const rand = random(1)
    for (const [target, kind] of [
      [110, 'hour'],
      [243, 'minute'],
      [3, 'minute'],
    ] as const) {
      const band = createBand(FILAMENTS[kind], WANDER[kind], rand)
      for (let i = 0; i < 30 * 30; i++) stepBand(band, target, WANDER[kind], 1 / 30, rand)
      // Within a few degrees, although each filament strays by ±WANDER.
      expect(angleDiff(peakAngle(band.bins), target)).toBeLessThan(kind === 'hour' ? 9 : 6)
      const peak = Math.max(...band.bins)
      const expected = steadyPeak(FILAMENTS[kind], WANDER[kind])
      expect(peak / expected).toBeGreaterThan(0.6)
      expect(peak / expected).toBeLessThan(1.8)
    }
  })

  it('filaments run from the core to the ring', () => {
    const path = filamentPath(90, 80, 12, random(2))
    expect(path[0]).toBeCloseTo(CORE_RADIUS, 4)
    expect(path[1]).toBeCloseTo(0, 4)
    expect(path[24]).toBeCloseTo(80, 4)
    expect(path[25]).toBeCloseTo(0, 4)
  })
})
