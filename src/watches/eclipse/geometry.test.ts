import { describe, expect, it } from 'vitest'
import { apertureDiscShape, circleHole, ECLIPSE, sectorHole } from './geometry'

const centroid = (pts: Array<{ x: number; y: number }>) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})

describe('eclipse geometry', () => {
  it('keeps the hour aperture inside its disc', () => {
    const d = ECLIPSE.hourDisc
    expect(d.apertureRadius - d.apertureSize).toBeGreaterThan(d.inner)
    expect(d.apertureRadius + d.apertureSize).toBeLessThan(d.outer)
  })

  it('keeps the minute window inside its disc and wide enough to show a numeral', () => {
    const { inner, outer, window } = ECLIPSE.minuteDisc
    expect(window.inner).toBeGreaterThan(inner)
    expect(window.outer).toBeLessThan(outer)
    // Numerals every 5 minutes (30°): a window of ±15° or more always shows one.
    expect(window.halfAngle).toBeGreaterThanOrEqual(15)
    expect(ECLIPSE.minuteScale.numeralRadius).toBeGreaterThan(window.inner)
    expect(ECLIPSE.minuteScale.tickOuter).toBeLessThan(window.outer)
  })

  it('builds a disc with a centre hole and one aperture at twelve', () => {
    const shape = apertureDiscShape(20, 72, circleHole(58, 11))
    expect(shape.holes).toHaveLength(2)
    const c = centroid(shape.holes[1].getPoints(32))
    expect(c.x).toBeCloseTo(0, 0)
    expect(c.y).toBeCloseTo(58, 0)
  })

  it('centres the sector window on twelve', () => {
    const pts = sectorHole(79, 98, 18).getPoints(16)
    const xs = pts.map((p) => p.x)
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(0, 5)
    expect(Math.min(...pts.map((p) => p.y))).toBeGreaterThan(70)
    for (const p of pts) expect(Math.abs(Math.atan2(p.x, p.y))).toBeLessThanOrEqual(0.315)
  })

  it('lets the moon cover the sun only partly', () => {
    expect(ECLIPSE.moon.orbit + ECLIPSE.moon.radius).toBeGreaterThan(ECLIPSE.sun)
    expect(ECLIPSE.moon.orbit).toBeLessThan(ECLIPSE.sun + ECLIPSE.moon.radius)
  })
})
