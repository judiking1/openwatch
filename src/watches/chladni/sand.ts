import type { ClockTime } from '../../utils/time'

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
  const minute = t.minutes + seconds / 60
  return {
    hour: (((t.hours % 12) + minute / 60) / 12) * 360,
    ring: ringRadius(minute),
    pulse: seconds % 1,
  }
}

/** Unit vector of a clock angle in dial xy (y up, clockwise from 12). */
function direction(clockDeg: number) {
  const a = (clockDeg * Math.PI) / 180
  return { x: Math.sin(a), y: Math.cos(a) }
}

/** Softening of the energy where the two still lines cross. */
const SOFT = 0.0025
const GAIN = 4

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

/** Deterministic pseudo-random numbers (mulberry32), so the sand looks the same each load. */
export function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Sand settles toward the still lines: drift down the energy slope, kicks where it shakes. */
export const DRIFT = 900
export const KICK = 60

const g = { x: 0, y: 0 }

/**
 * Advances grains (xy pairs) by `dt` seconds. Each grain drifts down ∇E and gets a random
 * kick proportional to the local vibration (√E), stronger during the pulse at the start of
 * every second; grains leaving the plate are reflected back onto it.
 */
export function stepSand(grains: Float32Array, pose: PlatePose, dt: number, rand: () => number) {
  const pulse = 1 + 2.5 * Math.exp(-pose.pulse * 10)
  const kick = KICK * Math.sqrt(dt) * pulse
  for (let i = 0; i < grains.length; i += 2) {
    let x = grains[i]
    let y = grains[i + 1]
    energyGradient(x, y, pose, g)
    const shake = Math.sqrt(energy(x, y, pose))
    x += -DRIFT * g.x * dt + (rand() - 0.5) * kick * shake
    y += -DRIFT * g.y * dt + (rand() - 0.5) * kick * shake
    const r = Math.hypot(x, y)
    if (r > PLATE_RADIUS) {
      const k = (2 * PLATE_RADIUS - r) / r
      x *= k
      y *= k
    }
    grains[i] = x
    grains[i + 1] = y
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
