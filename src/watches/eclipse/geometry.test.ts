import { describe, expect, it } from 'vitest'
import { apertureDiscShape, ECLIPSE } from './geometry'

describe('eclipse geometry', () => {
  it('keeps each aperture fully inside its disc', () => {
    for (const d of [ECLIPSE.hourDisc, ECLIPSE.minuteDisc]) {
      expect(d.apertureRadius - d.apertureSize).toBeGreaterThan(d.inner)
      expect(d.apertureRadius + d.apertureSize).toBeLessThan(d.outer)
    }
  })

  it('builds a disc with a centre hole and one aperture at twelve', () => {
    const shape = apertureDiscShape(20, 72, 58, 11)
    expect(shape.holes).toHaveLength(2)
    const pts = shape.holes[1].getPoints(32)
    const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length
    const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length
    expect(cx).toBeCloseTo(0, 0)
    expect(cy).toBeCloseTo(58, 0)
  })

  it('lets the moon cover the sun only partly', () => {
    expect(ECLIPSE.moon.orbit + ECLIPSE.moon.radius).toBeGreaterThan(ECLIPSE.sun)
    expect(ECLIPSE.moon.orbit).toBeLessThan(ECLIPSE.sun + ECLIPSE.moon.radius)
  })
})
