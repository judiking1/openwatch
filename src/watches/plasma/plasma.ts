import { gaussian } from '../../utils/random'
import { handAngles, type ClockTime } from '../../utils/time'

export { gaussian, random } from '../../utils/random'

/** Radius of the central electrode, dial units. */
export const CORE_RADIUS = 7
/** Electrode rings the filaments land on; each carries a phosphor band. */
export const HOUR_RING = 50
export const MINUTE_RING = 80
/** Filaments per ring. */
export const FILAMENTS = { hour: 3, minute: 4 } as const
/** How far a filament wanders from the time (stationary standard deviation, degrees). */
export const WANDER = { hour: 18, minute: 16 } as const
/** Correlation time of a filament's wandering, seconds. */
export const CORRELATION = 0.35
/** Phosphor afterglow time constant, seconds. */
export const AFTERGLOW = 5
/** Angular resolution of the phosphor bands. */
export const BINS = 240
/** Width of the spot one filament charges, degrees. */
export const SPOT = 3

export type PlasmaPose = {
  /** Clock angles the filaments are drawn to, degrees clockwise from 12. */
  hour: number
  minute: number
}

export function plasmaPose(t: ClockTime): PlasmaPose {
  const { hour, minute } = handAngles(t)
  return { hour, minute }
}

/**
 * Advances filament offsets (degrees from the time) by `dt` seconds: an Ornstein–Uhlenbeck
 * process, so each filament jitters freely but is always pulled back towards the time, and
 * over many seconds its landing points are normally distributed around it with s.d. `sd`.
 */
export function wander(offsets: Float64Array, sd: number, dt: number, rand: () => number) {
  const keep = Math.exp(-dt / CORRELATION)
  const noise = sd * Math.sqrt(1 - keep * keep)
  for (let i = 0; i < offsets.length; i++) offsets[i] = offsets[i] * keep + noise * gaussian(rand)
}

const wrap = (deg: number) => ((deg % 360) + 360) % 360
const BIN_DEG = 360 / BINS

/** Charges the phosphor where a filament lands: a small gaussian spot around `angle`. */
export function charge(bins: Float32Array, angle: number, amount: number) {
  const centre = wrap(angle) / BIN_DEG
  const reach = Math.ceil((2.5 * SPOT) / BIN_DEG)
  const i0 = Math.round(centre)
  for (let k = -reach; k <= reach; k++) {
    const d = (i0 + k - centre) * BIN_DEG
    const i = (((i0 + k) % BINS) + BINS) % BINS
    bins[i] += amount * Math.exp(-(d * d) / (2 * SPOT * SPOT))
  }
}

/** The phosphor gives its charge back as light: exponential afterglow. */
export function decay(bins: Float32Array, dt: number) {
  const keep = Math.exp(-dt / AFTERGLOW)
  for (let i = 0; i < bins.length; i++) bins[i] *= keep
}

/**
 * Charge at the brightest point of a band in steady state, per unit of `amount`/s: `n`
 * filaments whose landing points spread normally (s.d. `sd`) over the band.
 */
export function steadyPeak(n: number, sd: number) {
  return (n * AFTERGLOW * SPOT) / Math.hypot(sd, SPOT)
}

/** Where the band glows brightest: the reading. Circular mean around the brightest ±30°. */
export function peakAngle(bins: Float32Array) {
  // Box-smoothed first, so one fresh spot does not win over the accumulated glow.
  const half = Math.round(30 / BIN_DEG)
  let bestSum = -1
  let centre = 0
  for (let i = 0; i < BINS; i++) {
    let sum = 0
    for (let k = -half; k <= half; k++) sum += bins[(i + k + BINS) % BINS]
    if (sum > bestSum) {
      bestSum = sum
      centre = i
    }
  }
  let x = 0
  let y = 0
  for (let k = -half; k <= half; k++) {
    const i = (centre + k + BINS) % BINS
    const a = (i * BIN_DEG * Math.PI) / 180
    x += bins[i] * Math.sin(a)
    y += bins[i] * Math.cos(a)
  }
  return wrap((Math.atan2(x, y) * 180) / Math.PI)
}

export type Band = { offsets: Float64Array; bins: Float32Array }

export function createBand(filaments: number, sd: number, rand: () => number): Band {
  const offsets = new Float64Array(filaments)
  for (let i = 0; i < filaments; i++) offsets[i] = sd * gaussian(rand)
  return { offsets, bins: new Float32Array(BINS) }
}

/** One step of a band: filaments wander, charge the phosphor where they land, it decays. */
export function stepBand(band: Band, target: number, sd: number, dt: number, rand: () => number) {
  wander(band.offsets, sd, dt, rand)
  decay(band.bins, dt)
  for (const offset of band.offsets) charge(band.bins, target + offset, dt)
}

/**
 * A jagged filament from the core to a ring at clock angle `angle`, as xy pairs (y up).
 * The kinks are a random walk across the path, pinned at both ends, redrawn every frame.
 * If `lift` is given it receives a second, vertical walk (dial units, also pinned), so the
 * filament bends in 3D instead of lying in one plane.
 */
export function filamentPath(
  angle: number,
  radius: number,
  segments: number,
  rand: () => number,
  out = new Float32Array((segments + 1) * 2),
  lift?: Float32Array,
) {
  const a = (angle * Math.PI) / 180
  const ux = Math.sin(a)
  const uy = Math.cos(a)
  let walk = 0
  const kinks: number[] = []
  for (let i = 0; i <= segments; i++) {
    kinks.push(walk)
    walk += (rand() - 0.5) * 3.2
  }
  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    // Remove the walk's drift so the path ends on the ring, and taper at both electrodes.
    const across = (kinks[i] - kinks[segments] * f) * Math.sin(Math.PI * f) * 1.4
    const r = CORE_RADIUS + (radius - CORE_RADIUS) * f
    out[i * 2] = ux * r + uy * across
    out[i * 2 + 1] = uy * r - ux * across
  }
  if (lift) {
    let up = 0
    for (let i = 0; i <= segments; i++) {
      lift[i] = up
      up += (rand() - 0.5) * 2.4
    }
    for (let i = 0; i <= segments; i++) {
      const f = i / segments
      lift[i] = (lift[i] - lift[segments] * f) * Math.sin(Math.PI * f)
    }
  }
  return out
}

/** Bright strikes per second: brief flashes of the filaments and the crackle you hear. */
export const STRIKE_RATE = 5
/** A strike's flash fades with this time constant, seconds. */
export const STRIKE_FADE = 0.07

/** A touch on the crystal pulls extra filaments up to it, as on a plasma globe. */
export const TOUCH_FILAMENTS = 2
/** Height under the crystal where touch filaments end, dial units. */
export const CRYSTAL_Z = 8.5
/** Touch filaments flicker this far (degrees) around the touch point. */
export const TOUCH_JITTER = 2

/**
 * Where a touch at dial point (x, y) draws the filaments: clock angle and radius. Null on
 * the core itself or beyond the outer electrode ring. Touch filaments end on the glass, not
 * on a phosphor ring, so they never change the reading.
 */
export function touchTarget(x: number, y: number) {
  const radius = Math.hypot(x, y)
  if (radius < CORE_RADIUS + 3 || radius > MINUTE_RING + 6) return null
  return { angle: wrap((Math.atan2(x, y) * 180) / Math.PI), radius }
}
