import { handAngles, type ClockTime } from '../../utils/time'

export { random } from '../../utils/random'

/** Radius of the vibrating plate the sand lies on, dial units. */
export const PLATE_RADIUS = 84
/** Radius of the still circle at minute 0 and at minute 60. */
export const RING_START = 14
export const RING_END = 80

export type PlatePose = {
  /** Clock angle of the hour, degrees clockwise from 12 (the still diameter points here). */
  hour: number
  /** Radius of the still circle: the minute. */
  ring: number
  /** 0..1 through the current second (a drive pulse starts each second). */
  pulse: number
}

export function ringRadius(minute: number) {
  return RING_START + ((RING_END - RING_START) * minute) / 60
}

export function minuteFromRing(ring: number) {
  return ((ring - RING_START) / (RING_END - RING_START)) * 60
}

export function platePose(t: ClockTime): PlatePose {
  const seconds = t.seconds + t.milliseconds / 1000
  return {
    hour: handAngles(t).hour,
    ring: ringRadius(t.minutes + seconds / 60),
    pulse: seconds % 1,
  }
}

/** Unit vector of a clock angle in dial xy (y up, clockwise from 12). */
function direction(clockDeg: number) {
  const a = (clockDeg * Math.PI) / 180
  return { x: Math.sin(a), y: Math.cos(a) }
}

/** Softening of the energy where the two still lines cross. */
export const SOFT = 0.0025
export const GAIN = 4

/** Normalised distances across the still diameter (s) and from the still circle (d). */
function distances(x: number, y: number, pose: PlatePose) {
  const u = direction(pose.hour)
  return {
    u,
    s: (x * u.y - y * u.x) / PLATE_RADIUS,
    r: Math.hypot(x, y) || 1e-6,
    d: (Math.hypot(x, y) - pose.ring) / PLATE_RADIUS,
  }
}

/**
 * Vibration energy of the plate at (x, y): zero on the still diameter through the hour and
 * on the still circle of radius `ring`, rising away from both. A stylised (1,1)-like mode:
 * E = A·B / (A + B + c) with A = s², B = d² — like the smaller of the two squared distances,
 * but smooth, so sand gathers sharply on both lines and not in clouds where they cross.
 */
export function energy(x: number, y: number, pose: PlatePose) {
  const { s, d } = distances(x, y, pose)
  const A = s * s
  const B = d * d
  return (GAIN * A * B) / (A + B + SOFT)
}

/** ∇E at (x, y), written to `out`. */
export function energyGradient(
  x: number,
  y: number,
  pose: PlatePose,
  out = { x: 0, y: 0 },
): { x: number; y: number } {
  const { u, s, r, d } = distances(x, y, pose)
  const A = s * s
  const B = d * d
  const q = (A + B + SOFT) ** 2
  const dEds = (GAIN * B * (B + SOFT) * 2 * s) / q
  const dEdd = (GAIN * A * (A + SOFT) * 2 * d) / q
  // ∇s = (u.y, −u.x) / R, ∇d = (x, y) / (r R)
  out.x = (dEds * u.y + (dEdd * x) / r) / PLATE_RADIUS
  out.y = (dEds * -u.x + (dEdd * y) / r) / PLATE_RADIUS
  return out
}

/** Sand settles toward the still lines: drift down the energy slope, kicks where it shakes. */
export const DRIFT = 900
export const KICK = 60

const g = { x: 0, y: 0 }

/** How fast shaking grains slide downhill when the watch is tilted (units/s at full tilt). */
export const SLIDE = 220

/**
 * Sand piles up instead of passing through itself: grains are binned into a height grid
 * every step and slide down its slope (granular spreading, the simplest stand-in for
 * grain–grain contact). The same total volume is shared by however many grains there are,
 * so 4 000 CPU grains and 32 768 GPU grains build the same ridges.
 */
export const GRID = 96
/** Total sand volume, dial units³ (ridges ≈ 2–3 units high, steep enough to slide). */
export const SAND_VOLUME = 2000
/** Spreading speed per unit of slope beyond the angle of repose, units/s. */
export const PILE = 80
/** Sand slopes steeper than this (tan of a 34° angle of repose) slide; gentler ones hold. */
export const REPOSE = Math.tan((34 * Math.PI) / 180)
export const CELL = (2 * PLATE_RADIUS) / GRID

export type SandGrid = { heights: Float32Array; counts: Float32Array }

export function createGrid(): SandGrid {
  return { heights: new Float32Array(GRID * GRID), counts: new Float32Array(GRID * GRID) }
}

/** Grid cell of a dial position (clamped to the grid). */
export function cellOf(v: number) {
  return Math.min(GRID - 1, Math.max(0, Math.floor((v + PLATE_RADIUS) / CELL)))
}

/**
 * Bins the grains into the grid and turns counts into heights, lightly blurred (3×3) so that
 * a few hundred grains already read as a smooth ridge.
 */
export function depositSand(grains: Float32Array, grid: SandGrid) {
  const { counts, heights } = grid
  counts.fill(0)
  for (let i = 0; i < grains.length; i += 2) {
    counts[cellOf(grains[i + 1]) * GRID + cellOf(grains[i])] += 1
  }
  const perGrain = SAND_VOLUME / (grains.length / 2) / (CELL * CELL)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      let sum = 0
      let weight = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= GRID) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= GRID) continue
          const w = (dx ? 1 : 2) * (dy ? 1 : 2)
          sum += counts[yy * GRID + xx] * w
          weight += w
        }
      }
      heights[y * GRID + x] = (sum / weight) * perGrain
    }
  }
}

/** Height of the pile at a dial position (nearest cell): grains rest on top of it. */
export function heightAt(grid: SandGrid, x: number, y: number) {
  return grid.heights[cellOf(y) * GRID + cellOf(x)]
}

/** Height slope at a dial position (central differences on the grid), written to `out`. */
export function heightSlope(grid: SandGrid, x: number, y: number, out = { x: 0, y: 0 }) {
  const h = grid.heights
  const cx = cellOf(x)
  const cy = cellOf(y)
  const at = (i: number, j: number) =>
    h[Math.min(GRID - 1, Math.max(0, j)) * GRID + Math.min(GRID - 1, Math.max(0, i))]
  out.x = (at(cx + 1, cy) - at(cx - 1, cy)) / (2 * CELL)
  out.y = (at(cx, cy + 1) - at(cx, cy - 1)) / (2 * CELL)
  return out
}

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

/**
 * A neighbour grid for grain contacts: cells one grain diameter wide, each with a linked list
 * of the grains in it (`head` per cell, `next` per grain), rebuilt every step.
 */
export type Contacts = {
  radius: number
  size: number
  cell: number
  head: Int32Array
  next: Int32Array
}

export function createContacts(count: number, radius: number): Contacts {
  const cell = 2 * radius
  const size = Math.ceil((2 * PLATE_RADIUS) / cell) + 1
  return { radius, size, cell, head: new Int32Array(size * size), next: new Int32Array(count) }
}

function contactCell(c: Contacts, v: number) {
  return Math.min(c.size - 1, Math.max(0, Math.floor((v + PLATE_RADIUS) / c.cell)))
}

/**
 * Pushes overlapping grains apart (each moves half the overlap along the line between them).
 * One pass per step; overlaps left over are resolved over the next steps.
 */
export function collideGrains(grains: Float32Array, c: Contacts) {
  const { head, next, size } = c
  const count = grains.length / 2
  head.fill(-1)
  for (let i = 0; i < count; i++) {
    const k = contactCell(c, grains[i * 2 + 1]) * size + contactCell(c, grains[i * 2])
    next[i] = head[k]
    head[k] = i
  }
  const touch = 2 * c.radius
  for (let i = 0; i < count; i++) {
    const cx = contactCell(c, grains[i * 2])
    const cy = contactCell(c, grains[i * 2 + 1])
    for (let dy = -1; dy <= 1; dy++) {
      const yy = cy + dy
      if (yy < 0 || yy >= size) continue
      for (let dx = -1; dx <= 1; dx++) {
        const xx = cx + dx
        if (xx < 0 || xx >= size) continue
        for (let j = head[yy * size + xx]; j !== -1; j = next[j]) {
          if (j <= i) continue
          const ex = grains[j * 2] - grains[i * 2]
          const ey = grains[j * 2 + 1] - grains[i * 2 + 1]
          const d = Math.hypot(ex, ey)
          if (d >= touch) continue
          // Coincident grains: split along an arbitrary but fixed direction.
          const nx = d > 1e-6 ? ex / d : 1
          const ny = d > 1e-6 ? ey / d : 0
          const push = (touch - d) / 2
          grains[i * 2] -= nx * push
          grains[i * 2 + 1] -= ny * push
          grains[j * 2] += nx * push
          grains[j * 2 + 1] += ny * push
        }
      }
    }
  }
}

/** Grains scattered uniformly over the plate. */
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
