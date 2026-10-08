import { describe, expect, it } from 'vitest'
import { tiltFromDevice, tiltFromView, tiltPolar } from './tilt'

describe('tilt', () => {
  it('ignores ordinary viewing angles and leans away from a far-oblique camera', () => {
    expect(tiltFromView({ x: 0, y: 0, z: 1 })).toEqual({ x: 0, y: 0 })
    // The stage's default camera is about 8° off-axis: level.
    expect(tiltPolar(tiltFromView({ x: 0.06, y: -0.14, z: 0.99 })).strength).toBe(0)
    const below = tiltFromView({ x: 0, y: -0.866, z: 0.5 }) // 60° below
    expect(tiltPolar(below).angle).toBeCloseTo(0, 6) // camera below → 12 side is low
    expect(tiltPolar(below).strength).toBeGreaterThan(0.1)
    expect(tiltPolar(below).strength).toBeLessThan(0.2)
  })

  it('reads a phone tilted toward its right edge as gravity toward 3 o’clock', () => {
    const right = tiltFromDevice(0, 30)
    expect(tiltPolar(right).angle).toBeCloseTo(90, 6)
    expect(tiltPolar(right).strength).toBeCloseTo(0.5, 6)
    expect(tiltPolar(tiltFromDevice(0, 0)).strength).toBeCloseTo(0, 6)
  })
})
