import { describe, expect, it } from 'vitest'
import {
  energy,
  energyGradient,
  minuteFromRing,
  PLATE_RADIUS,
  platePose,
  random,
  ringRadius,
  scatterSand,
  stepSand,
} from './sand'

const t = (hours: number, minutes: number, seconds = 0, milliseconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds,
})

describe('chladni plate', () => {
  it('maps the hour to the still diameter and the minute to the still circle', () => {
    const pose = platePose(t(15, 30))
    expect(pose.hour).toBeCloseTo(105, 6)
    expect(minuteFromRing(pose.ring)).toBeCloseTo(30, 6)
    expect(ringRadius(0)).toBeLessThan(ringRadius(59))
  })

  it('is still on the diameter through the hour and on the circle, and shakes elsewhere', () => {
    const pose = { hour: 90, ring: 40, pulse: 0 } // hour at 3 o'clock → the +x axis
    expect(energy(60, 0, pose)).toBeCloseTo(0, 9)
    expect(energy(-40, 0, pose)).toBeCloseTo(0, 9)
    expect(energy(0, pose.ring, pose)).toBeCloseTo(0, 9)
    expect(energy(20, 50, pose)).toBeGreaterThan(0.01)
  })

  it('has a gradient that matches finite differences', () => {
    const pose = platePose(t(7, 41, 12))
    const h = 1e-3
    for (const [x, y] of [
      [12, -30],
      [-50, 20],
      [33, 33],
    ]) {
      const g = energyGradient(x, y, pose)
      const fx = (energy(x + h, y, pose) - energy(x - h, y, pose)) / (2 * h)
      const fy = (energy(x, y + h, pose) - energy(x, y - h, pose)) / (2 * h)
      expect(g.x).toBeCloseTo(fx, 6)
      expect(g.y).toBeCloseTo(fy, 6)
    }
  })

  it('settles scattered sand onto the still lines and keeps it on the plate', () => {
    const rand = random(7)
    const pose = { ...platePose(t(10, 15)), pulse: 0.5 }
    const grains = scatterSand(3000, rand)
    const mean = () => {
      let e = 0
      for (let i = 0; i < grains.length; i += 2) e += energy(grains[i], grains[i + 1], pose)
      return e / (grains.length / 2)
    }
    const before = mean()
    for (let k = 0; k < 240; k++) stepSand(grains, pose, 1 / 60, rand)
    expect(mean()).toBeLessThan(before * 0.2)
    for (let i = 0; i < grains.length; i += 2) {
      expect(Math.hypot(grains[i], grains[i + 1])).toBeLessThanOrEqual(PLATE_RADIUS + 1e-3)
    }
  })
})
