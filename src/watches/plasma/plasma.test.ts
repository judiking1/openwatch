import { describe, expect, it } from 'vitest'
import { angleDistance, clockTime as t } from '../../utils/time'
import {
  AFTERGLOW,
  BINS,
  charge,
  CORE_RADIUS,
  createBand,
  decay,
  filamentPath,
  FILAMENTS,
  peakAngle,
  plasmaPose,
  random,
  steadyPeak,
  stepBand,
  touchTarget,
  WANDER,
  wander,
} from './plasma'

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
      expect(angleDistance(peakAngle(band.bins), target)).toBeLessThan(kind === 'hour' ? 9 : 6)
      const peak = Math.max(...band.bins)
      const expected = steadyPeak(FILAMENTS[kind], WANDER[kind])
      expect(peak / expected).toBeGreaterThan(0.6)
      expect(peak / expected).toBeLessThan(1.8)
    }
  })

  it('filaments bend in 3D but stay pinned to both electrodes', () => {
    const lift = new Float32Array(13)
    filamentPath(90, 80, 12, random(5), undefined, lift)
    expect(lift[0]).toBeCloseTo(0, 6)
    expect(lift[12]).toBeCloseTo(0, 6)
    expect(Math.max(...lift.map(Math.abs))).toBeGreaterThan(0.1)
  })

  it('filaments run from the core to the ring', () => {
    const path = filamentPath(90, 80, 12, random(2))
    expect(path[0]).toBeCloseTo(CORE_RADIUS, 4)
    expect(path[1]).toBeCloseTo(0, 4)
    expect(path[24]).toBeCloseTo(80, 4)
    expect(path[25]).toBeCloseTo(0, 4)
  })
})

describe('plasma touch', () => {
  it('pulls filaments to the touch point, not on the core or off the dial', () => {
    const at3 = touchTarget(40, 0)
    expect(at3?.angle).toBeCloseTo(90, 6)
    expect(at3?.radius).toBeCloseTo(40, 6)
    expect(touchTarget(-30, -30)?.angle).toBeCloseTo(225, 6)
    expect(touchTarget(2, 2)).toBeNull()
    expect(touchTarget(95, 0)).toBeNull()
  })
})
