import { handAngles, jumpHourAngle, type ClockTime } from '../../utils/time'

export type TurntablePose = {
  /** Rotation of the whole head in dial degrees (negative = anticlockwise). */
  head: number
  /** Hands relative to the head. */
  minute: number
  second: number
}

/**
 * The head turns anticlockwise by the (jumping) hour so the current hour numeral
 * sits under the fixed index at twelve; the hands run normally inside the head.
 */
export function turntablePose(t: ClockTime): TurntablePose {
  const a = handAngles(t)
  return { head: -jumpHourAngle(t), minute: a.minute, second: a.second }
}

/** World angle of something drawn at `localAngle` on the head. */
export function onHead(localAngle: number, head: number): number {
  return (((localAngle + head) % 360) + 360) % 360
}
