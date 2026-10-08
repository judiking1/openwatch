import { angleDelta, degToRad } from '../../utils/time'

/** Tilt of each dish, degrees. Small enough to look like a gimbal, large enough to read. */
export const DISH_TILT = 6

/** A marble rolling in a circular groove of a tilted dish (angles in dial degrees). */
export type MarbleState = { angle: number; velocity: number }

const GRAVITY = 900 // °/s² restoring acceleration at 90° from the low point
const DAMPING = 2.4 // 1/s, rolling resistance

/**
 * Tilt of the whole watch felt in the groove: clock angle of the low side and its strength
 * as sin(tilt). It adds to the dish's own slope (sin DISH_TILT), so a tilt larger than the
 * dish's takes the marble away from the time — hold the watch level to read it.
 */
export type WatchTilt = { angle: number; strength: number }

/**
 * One integration step. The groove's low point is `lowAngle`; the marble feels a
 * restoring force ∝ sin(offset) like a pendulum, so it settles there and sloshes when the
 * dish swings fast (accelerated time).
 */
export function stepMarble(
  s: MarbleState,
  lowAngle: number,
  dt: number,
  tilt?: WatchTilt,
): MarbleState {
  const offset = angleDelta(s.angle, lowAngle)
  let accel = -GRAVITY * Math.sin(degToRad(offset)) - DAMPING * s.velocity
  if (tilt && tilt.strength > 0) {
    const ratio = tilt.strength / Math.sin(degToRad(DISH_TILT))
    accel -= GRAVITY * ratio * Math.sin(degToRad(angleDelta(s.angle, tilt.angle)))
  }
  const velocity = s.velocity + accel * dt
  return { angle: (s.angle + velocity * dt + 360) % 360, velocity }
}

/** Integrates over `duration` in fixed sub-steps for stability regardless of frame rate. */
export function advanceMarble(
  s: MarbleState,
  lowAngle: number,
  duration: number,
  tilt?: WatchTilt,
  step = 1 / 240,
): MarbleState {
  let state = s
  for (let t = 0; t < duration; t += step)
    state = stepMarble(state, lowAngle, Math.min(step, duration - t), tilt)
  return state
}
