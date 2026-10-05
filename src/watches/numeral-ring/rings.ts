import { handAngles, jumpHourAngle, type ClockTime, type HandAngles } from '../../utils/time'

/**
 * The beam is fixed at 0°. Each ring is rotated by minus the value's angle, so the
 * mark for the current value lands under the beam. Hours jump (one numeral sits
 * centred under the beam for the whole hour) so 7:45 never reads as "8".
 */
export function ringRotations(t: ClockTime): HandAngles {
  const a = handAngles(t)
  return { hour: -jumpHourAngle(t), minute: -a.minute, second: -a.second }
}

/** Where a mark printed at `markAngle` on a ring ends up after rotating the ring. */
export function worldAngle(markAngle: number, ringRotation: number): number {
  return (((markAngle + ringRotation) % 360) + 360) % 360
}
