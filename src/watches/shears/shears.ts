import { handAngles, type ClockTime } from '../../utils/time'

/** Degrees the pair opens per minute: fully open (180°) at 60 minutes. */
export const OPENING_PER_MINUTE = 3

export const SECONDS_TRACK = { inner: 12, outer: 50 } as const

export type ShearsPose = {
  /** Direction of the bisector (hour), dial degrees. */
  bisector: number
  /** Angle between the blades (minutes × 3°). */
  opening: number
  bladeA: number
  bladeB: number
  /** Radial position of the seconds bead along the handles. */
  secondRadius: number
}

export function shearsPose(t: ClockTime): ShearsPose {
  const a = handAngles(t)
  const minutes = a.minute / 6
  const seconds = a.second / 6
  const bisector = a.hour
  const opening = minutes * OPENING_PER_MINUTE
  return {
    bisector,
    opening,
    bladeA: bisector - opening / 2,
    bladeB: bisector + opening / 2,
    secondRadius:
      SECONDS_TRACK.inner + (SECONDS_TRACK.outer - SECONDS_TRACK.inner) * (seconds / 60),
  }
}

/** Inverse reading, used to prove the display is unambiguous. */
export function readShears(pose: Pick<ShearsPose, 'bladeA' | 'bladeB'>) {
  const opening = pose.bladeB - pose.bladeA
  const bisector = (((pose.bladeA + opening / 2) % 360) + 360) % 360
  return { hours: bisector / 30, minutes: opening / OPENING_PER_MINUTE }
}
