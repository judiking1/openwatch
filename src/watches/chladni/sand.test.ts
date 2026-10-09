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
  createGrid,
  depositSand,
  CELL,
  SAND_VOLUME,
  GRID,
} from './sand'
import { createHeightfieldGeometry, SAND_BASE_Z, writeHeightfield } from './heightfield'

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

  it('deposits the whole sand volume into the height grid', () => {
    const grains = scatterSand(2000, random(3))
    const grid = createGrid()
    depositSand(grains, grid)
    const volume = grid.heights.reduce((a, h) => a + h, 0) * CELL * CELL
    // The blur loses a little at the grid edge, outside the plate; nothing inside.
    expect(volume / SAND_VOLUME).toBeGreaterThan(0.97)
    expect(volume / SAND_VOLUME).toBeLessThan(1.03)
  })

  it('piles: settled ridges get wider but stay on the still lines', () => {
    const pose = { ...platePose(t(10, 15)), pulse: 0.5 }
    const run = (piled: boolean) => {
      const rand = random(7)
      const grains = scatterSand(3000, rand)
      const grid = piled ? createGrid() : undefined
      for (let k = 0; k < 360; k++) stepSand(grains, pose, 1 / 60, rand, undefined, grid)
      // Spread of the grains across the still diameter, near the centre of it.
      const u = {
        x: Math.sin((pose.hour * Math.PI) / 180),
        y: Math.cos((pose.hour * Math.PI) / 180),
      }
      let sq = 0
      let count = 0
      for (let i = 0; i < grains.length; i += 2) {
        const along = grains[i] * u.x + grains[i + 1] * u.y
        const across = grains[i] * u.y - grains[i + 1] * u.x
        if (along > -70 && along < -20 && Math.abs(across) < 8) {
          sq += across * across
          count++
        }
      }
      let e = 0
      for (let i = 0; i < grains.length; i += 2) e += energy(grains[i], grains[i + 1], pose)
      return { width: Math.sqrt(sq / count), energy: e / (grains.length / 2) }
    }
    const loose = run(false)
    const piled = run(true)
    expect(piled.width).toBeGreaterThan(loose.width * 1.3)
    expect(piled.energy).toBeLessThan(0.05)
  })

  it('the heightfield puts sand on the plate and hides the rest below it', () => {
    const grid = createGrid()
    grid.heights.fill(1)
    const geometry = createHeightfieldGeometry()
    writeHeightfield(geometry, grid.heights)
    const z = geometry.getAttribute('position')
    // Centre vertex: on the plate. Corner vertex: outside, below the plate surface.
    const centre = (GRID / 2) * GRID + GRID / 2
    expect(z.getZ(centre)).toBeCloseTo(SAND_BASE_Z + 1, 5)
    expect(z.getZ(0)).toBeLessThan(SAND_BASE_Z)
    // Vertex positions line up with the cell centres.
    expect(z.getX(centre)).toBeCloseTo((GRID / 2 + 0.5) * CELL - PLATE_RADIUS, 4)
    geometry.dispose()
  })
})
