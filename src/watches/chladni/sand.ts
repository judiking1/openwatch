import { collideGrains, type Contacts } from './contacts'
import { depositSand, heightSlope, PILE, REPOSE, type SandGrid } from './pile'
import { energy, energyGradient, PLATE_RADIUS, type PlatePose } from './plate'

/**
 * Chladni sand: grains on the vibrating plate (`plate.ts`), piling up (`pile.ts`) and touching
 * (`contacts.ts`). Everything is re-exported here, the module the watch and its tests use.
 */
export * from './contacts'
export * from './pile'
export * from './plate'
export { random } from '../../utils/random'

/** Sand settles toward the still lines: drift down the energy slope, kicks where it shakes. */
export const DRIFT = 900
export const KICK = 60

const g = { x: 0, y: 0 }

/** How fast shaking grains slide downhill when the watch is tilted (units/s at full tilt). */
export const SLIDE = 220

const slope = { x: 0, y: 0 }

export type SandOptions = {
  /** In-plane gravity from how the watch is held (see `three/stage/tilt`). */
  tilt?: { x: number; y: number }
  /** Height grid: grains pile up and slide where the pile is steeper than `REPOSE`. */
  grid?: SandGrid
  /** Neighbour grid: grains of this radius push each other apart instead of overlapping. */
  contacts?: Contacts
}

/**
 * Advances grains (xy pairs) by `dt` seconds. Each grain drifts down ∇E and gets a random
 * kick proportional to the local vibration (√E), stronger during the pulse at the start of
 * every second; grains shaken loose slide with the watch's tilt; on a pile they slide down
 * slopes steeper than the angle of repose; touching grains push apart; grains leaving the
 * plate are reflected back onto it.
 */
export function stepSand(
  grains: Float32Array,
  pose: PlatePose,
  dt: number,
  rand: () => number,
  { tilt = { x: 0, y: 0 }, grid, contacts }: SandOptions = {},
) {
  const pulse = 1 + 2.5 * Math.exp(-pose.pulse * 10)
  const kick = KICK * Math.sqrt(dt) * pulse
  if (grid) depositSand(grains, grid)
  for (let i = 0; i < grains.length; i += 2) {
    let x = grains[i]
    let y = grains[i + 1]
    energyGradient(x, y, pose, g)
    const shake = Math.sqrt(energy(x, y, pose))
    // Only grains that are being shaken loose slide with the tilt.
    const slide = SLIDE * Math.min(1, shake * 4) * dt
    x += -DRIFT * g.x * dt + (rand() - 0.5) * kick * shake + tilt.x * slide
    y += -DRIFT * g.y * dt + (rand() - 0.5) * kick * shake + tilt.y * slide
    if (grid) {
      heightSlope(grid, grains[i], grains[i + 1], slope)
      const steep = Math.hypot(slope.x, slope.y)
      const excess = Math.max(0, steep - REPOSE) / (steep || 1)
      x -= PILE * slope.x * excess * dt
      y -= PILE * slope.y * excess * dt
    }
    const r = Math.hypot(x, y)
    if (r > PLATE_RADIUS) {
      const k = (2 * PLATE_RADIUS - r) / r
      x *= k
      y *= k
    }
    grains[i] = x
    grains[i + 1] = y
  }
  if (contacts) collideGrains(grains, contacts)
}

export function scatterSand(count: number, rand: () => number) {
  const grains = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const r = PLATE_RADIUS * Math.sqrt(rand())
    const a = rand() * Math.PI * 2
    grains[i * 2] = r * Math.cos(a)
    grains[i * 2 + 1] = r * Math.sin(a)
  }
  return grains
}
