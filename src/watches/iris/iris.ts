import type { ClockTime } from '../../utils/time'

/** Number of blades. Their straight edges form a regular N-gon opening. */
export const BLADES = 9
/** Outer radius of the blades (inside the printed hour ring), dial units. */
export const BLADE_RADIUS = 86
/** Opening at minute 0 and just before the next hour (inradius of the polygon). */
export const R_OPEN = 78
export const R_CLOSED = 10
/** The blades snap back open over this long at the top of the hour. */
export const SNAP_SECONDS = 0.6

const ease = (x: number) => 1 - (1 - x) ** 3

/** Radius of the minute ring for a (fractional) minute: the edge reaches it at that time. */
export function ringRadius(minute: number) {
  return R_OPEN - ((R_OPEN - R_CLOSED) * minute) / 60
}

export type IrisPose = {
  /** Inradius of the opening (where each blade edge touches), dial units. */
  aperture: number
  /** Clockwise clock angle of the blade carrier (blade 0 points at the hour), degrees. */
  carrier: number
  /** Clockwise clock angle of the seconds hand, degrees. */
  second: number
  /** 0..1 while the blades snap open at the top of the hour, otherwise null. */
  snap: number | null
}

export function irisPose(t: ClockTime): IrisPose {
  const seconds = t.seconds + t.milliseconds / 1000
  const minute = t.minutes + seconds / 60
  const sinceHour = t.minutes * 60 + seconds
  const snap = sinceHour < SNAP_SECONDS ? sinceHour / SNAP_SECONDS : null
  const aperture = snap === null ? ringRadius(minute) : R_CLOSED + (R_OPEN - R_CLOSED) * ease(snap)
  return {
    aperture,
    carrier: (((t.hours % 12) + minute / 60) / 12) * 360,
    second: (seconds / 60) * 360,
    snap,
  }
}

/** The minute shown by an opening of radius `aperture` (inverse of `ringRadius`). */
export function minuteFromAperture(aperture: number) {
  return ((R_OPEN - aperture) / (R_OPEN - R_CLOSED)) * 60
}

/**
 * Outline of one blade in the dial plane: the circular segment of the blade disc
 * (`BLADE_RADIUS`) beyond a chord at distance `aperture` from the centre, with outward
 * normal at math angle `normal` (radians, counter-clockwise from +x). The first and last
 * points are the chord's ends; `out` is filled in place (`arcPoints + 1` xy pairs).
 */
export function bladeOutline(
  aperture: number,
  normal: number,
  arcPoints: number,
  out: Float32Array,
  radius = BLADE_RADIUS,
) {
  const half = Math.acos(Math.min(1, aperture / radius))
  for (let i = 0; i <= arcPoints; i++) {
    const a = normal - half + (2 * half * i) / arcPoints
    out[i * 2] = radius * Math.cos(a)
    out[i * 2 + 1] = radius * Math.sin(a)
  }
  return out
}
