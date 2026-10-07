import type { Object3D } from 'three'

/**
 * How far each layer rises when the watch is fully exploded, in dial units (dial radius 100).
 * Parts opt in with `userData.explode`; the hands are found by their conventional names.
 */
export const EXPLODE_LIFT = {
  crystal: 90,
  bezel: 62,
  second: 46,
  minute: 38,
  hour: 30,
  caseback: -55,
} as const

const HAND_NAMES = ['hour', 'minute', 'second'] as const

/** Lift for an object, or null when it does not take part in the exploded view. */
export function explodeLift(object: Pick<Object3D, 'name' | 'userData'>): number | null {
  const tagged = object.userData.explode
  if (typeof tagged === 'number') return tagged
  const hand = HAND_NAMES.find((name) => name === object.name)
  return hand ? EXPLODE_LIFT[hand] : null
}

/** Smooth step toward a target value; frame-rate independent. */
export function approach(current: number, target: number, dt: number, rate = 8) {
  return target + (current - target) * Math.exp(-rate * dt)
}
