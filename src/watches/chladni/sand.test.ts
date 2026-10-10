import { describe, expect, it } from 'vitest'
import { clockTime as t } from '../../utils/time'
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
  REPOSE,
  heightSlope,
  createContacts,
  collideGrains,
} from './sand'
import { createHeightfieldGeometry, SAND_BASE_Z, writeHeightfield } from './heightfield'

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

  it('piles: ridges stay on the still lines and hold near the angle of repose', () => {
    const pose = { ...platePose(t(10, 15)), pulse: 0.5 }
    const u = { x: Math.sin((pose.hour * Math.PI) / 180), y: Math.cos((pose.hour * Math.PI) / 180) }
    const run = (piled: boolean) => {
      const rand = random(7)
      const grains = scatterSand(3000, rand)
      const grid = createGrid()
      for (let k = 0; k < 360; k++) stepSand(grains, pose, 1 / 60, rand, piled ? { grid } : {})
      // Spread of the grains across the still diameter, near the centre of it.
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
      depositSand(grains, grid)
      let steepest = 0
      for (let y = 1; y < GRID - 1; y++) {
        for (let x = 1; x < GRID - 1; x++) {
          const s = heightSlope(
            grid,
            (x + 0.5) * CELL - PLATE_RADIUS,
            (y + 0.5) * CELL - PLATE_RADIUS,
          )
          steepest = Math.max(steepest, Math.hypot(s.x, s.y))
        }
      }
      return { width: Math.sqrt(sq / count), energy: e / (grains.length / 2), steepest }
    }
    const loose = run(false)
    const piled = run(true)
    expect(piled.width).toBeGreaterThanOrEqual(loose.width)
    expect(piled.energy).toBeLessThan(0.05)
    // Loose sand stacks steeper than sand can stand; piled sand slides back towards repose
    // (measured on the blurred grid, so a little above it).
    expect(loose.steepest).toBeGreaterThan(REPOSE * 1.5)
    expect(piled.steepest).toBeLessThan(REPOSE * 1.35)
  })

  it('grains in contact push apart instead of overlapping', () => {
    const rand = random(11)
    const grains = new Float32Array(400)
    // 200 grains dropped into a 4 × 4 square: far too many to fit without overlapping.
    for (let i = 0; i < grains.length; i++) grains[i] = (rand() - 0.5) * 4
    const contacts = createContacts(200, 0.5)
    for (let k = 0; k < 200; k++) collideGrains(grains, contacts)
    let closest = Infinity
    for (let i = 0; i < 200; i++) {
      for (let j = i + 1; j < 200; j++) {
        const d = Math.hypot(grains[i * 2] - grains[j * 2], grains[i * 2 + 1] - grains[j * 2 + 1])
        closest = Math.min(closest, d)
      }
    }
    expect(closest).toBeGreaterThan(0.85)
    // Two grains on the very same spot are separated too.
    const pair = new Float32Array([10, 10, 10, 10])
    collideGrains(pair, createContacts(2, 0.5))
    expect(Math.hypot(pair[0] - pair[2], pair[1] - pair[3])).toBeCloseTo(1, 5)
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
