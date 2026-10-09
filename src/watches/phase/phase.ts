import { handAngles, type ClockTime } from '../../utils/time'

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
  return { ...handAngles(t), seconds: t.seconds + t.milliseconds / 1000 }
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
