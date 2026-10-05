import type { HandAngles } from '../../utils/time'

/**
 * The beam is fixed at 0°. Each ring is rotated by minus the hand angle, so the
 * mark that represents the current value lands under the beam.
 */
export function ringRotations(angles: HandAngles): HandAngles {
  return { hour: -angles.hour, minute: -angles.minute, second: -angles.second }
}

/** Where a mark printed at `markAngle` on a ring ends up after rotating the ring. */
export function worldAngle(markAngle: number, ringRotation: number): number {
  return (((markAngle + ringRotation) % 360) + 360) % 360
}
