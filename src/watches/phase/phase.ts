import type { ClockTime } from '../../utils/time'

/** Fixed emitters on a small ring around the centre: nothing on this dial moves. */
export const EMITTERS = 32
export const EMITTER_RING = 20
/** The waves are focused on these rings: hour inside, minute outside. */
export const HOUR_RING = 48
export const MINUTE_RING = 74
/** Wavelengths, dial units: long waves for the hour, short for the minute (sharper focus). */
export const HOUR_WAVE = 12
export const MINUTE_WAVE = 6
/** Waves are drawn out to this radius. */
export const FIELD_RADIUS = 84
/** Crests leave the emitters once a second, so the foci flash with the seconds. */
export const FREQUENCY = 1

export type PhasePose = {
  /** Clock angles of the two foci, degrees clockwise from 12. */
  hour: number
  minute: number
  /** Seconds hand angle, degrees. */
  second: number
  /** Seconds since the minute began (drives the wave phase). */
  seconds: number
}

export function phasePose(t: ClockTime): PhasePose {
  const seconds = t.seconds + t.milliseconds / 1000
  const minute = t.minutes + seconds / 60
  return {
    hour: (((t.hours % 12) + minute / 60) / 12) * 360,
    minute: minute * 6,
    second: seconds * 6,
    seconds,
  }
}

/** Point at clock angle `deg` on a circle of `radius` (dial xy, y up). */
export function polar(radius: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: radius * Math.sin(a), y: radius * Math.cos(a) }
}

export const EMITTER_POSITIONS = Array.from({ length: EMITTERS }, (_, k) =>
  polar(EMITTER_RING, (k * 360) / EMITTERS),
)

/**
 * Drive phases that focus the array on `focus`: emitter k is delayed by its distance to the
 * focus, so every wave arrives there in step (φₖ = −k·dₖ). This is how phased arrays and
 * ultrasound transducers focus; here the focus is the hand.
 */
export function focusPhases(focus: { x: number; y: number }, wavelength: number) {
  const k = (2 * Math.PI) / wavelength
  return EMITTER_POSITIONS.map((p) => -k * Math.hypot(focus.x - p.x, focus.y - p.y))
}

/** Complex amplitude at (x, y), normalised so that it is 1 where all waves agree. */
export function field(x: number, y: number, phases: number[], wavelength: number) {
  const k = (2 * Math.PI) / wavelength
  let re = 0
  let im = 0
  EMITTER_POSITIONS.forEach((p, i) => {
    const a = k * Math.hypot(x - p.x, y - p.y) + phases[i]
    re += Math.cos(a)
    im += Math.sin(a)
  })
  return { re: re / EMITTERS, im: im / EMITTERS }
}

export function amplitude(x: number, y: number, phases: number[], wavelength: number) {
  const f = field(x, y, phases, wavelength)
  return Math.hypot(f.re, f.im)
}

/** Clock angle of the brightest point on a ring: how the dial is read. */
export function brightestAngle(radius: number, phases: number[], wavelength: number, steps = 1440) {
  let best = 0
  let bestA = -1
  for (let i = 0; i < steps; i++) {
    const deg = (i * 360) / steps
    const p = polar(radius, deg)
    const a = amplitude(p.x, p.y, phases, wavelength)
    if (a > bestA) {
      bestA = a
      best = deg
    }
  }
  return best
}

/** Distances from every grid cell to every emitter, computed once. */
export type FieldGrid = { size: number; extent: number; dist: Float32Array; fade: Float32Array }

export function createGrid(size: number, extent = FIELD_RADIUS): FieldGrid {
  const cells = size * size
  const dist = new Float32Array(cells * EMITTERS)
  const fade = new Float32Array(cells)
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const c = j * size + i
      const x = ((i + 0.5) / size) * 2 * extent - extent
      const y = ((j + 0.5) / size) * 2 * extent - extent
      const r = Math.hypot(x, y)
      // Soft edges at the rim and inside the emitter ring.
      fade[c] =
        Math.min(1, Math.max(0, (extent - r) / 4)) *
        Math.min(1, Math.max(0, (r - EMITTER_RING + 2) / 4))
      for (let k = 0; k < EMITTERS; k++) {
        const p = EMITTER_POSITIONS[k]
        dist[c * EMITTERS + k] = Math.hypot(x - p.x, y - p.y)
      }
    }
  }
  return { size, extent, dist, fade }
}

/** The complex field over the grid for one set of drive phases (the slow part). */
export function focusField(
  grid: FieldGrid,
  phases: number[],
  wavelength: number,
  re: Float32Array,
  im: Float32Array,
) {
  const k = (2 * Math.PI) / wavelength
  const cells = grid.size * grid.size
  for (let c = 0; c < cells; c++) {
    let sr = 0
    let si = 0
    const o = c * EMITTERS
    for (let e = 0; e < EMITTERS; e++) {
      const a = k * grid.dist[o + e] + phases[e]
      sr += Math.cos(a)
      si += Math.sin(a)
    }
    re[c] = sr / EMITTERS
    im[c] = si / EMITTERS
  }
}

/**
 * The travelling wave at time `seconds` (the fast part, every frame): crests in white on
 * black, full contrast everywhere so the ripples read, brightest where the waves agree.
 */
export function writeWave(
  grid: FieldGrid,
  re: Float32Array,
  im: Float32Array,
  seconds: number,
  out: Uint8Array,
) {
  const w = 2 * Math.PI * FREQUENCY * seconds
  const c = Math.cos(w)
  const s = Math.sin(w)
  const cells = grid.size * grid.size
  for (let p = 0; p < cells; p++) {
    const amp = Math.hypot(re[p], im[p])
    // Re(F·e^{−iωt}): the instantaneous wave, as a fraction of its local amplitude.
    const v = (re[p] * c + im[p] * s) / (amp + 1e-6)
    const crest = v > 0 ? v * v : 0
    const b = crest * (0.18 + 0.82 * amp * amp) * grid.fade[p]
    const byte = Math.round(255 * Math.min(1, b))
    out[p * 4] = byte
    out[p * 4 + 1] = byte
    out[p * 4 + 2] = byte
    out[p * 4 + 3] = 255
  }
}
