import { angleDelta, degToRad } from '../../utils/time'

/** Tilt of each dish, degrees. Small enough to look like a gimbal, large enough to read. */
export const DISH_TILT = 6

/** A marble rolling in a circular groove of a tilted dish (angles in dial degrees). */
export type MarbleState = { angle: number; velocity: number }

const GRAVITY = 900 // °/s² restoring acceleration at 90° from the low point
const DAMPING = 2.4 // 1/s, rolling resistance

/**
 * One integration step. The groove's low point is `lowAngle`; the marble feels a
 * restoring force ∝ sin(offset) like a pendulum, so it settles there and sloshes when the
 * dish swings fast (accelerated time).
 */
export function stepMarble(s: MarbleState, lowAngle: number, dt: number): MarbleState {
  const offset = angleDelta(s.angle, lowAngle)
  const accel = -GRAVITY * Math.sin(degToRad(offset)) - DAMPING * s.velocity
  const velocity = s.velocity + accel * dt
  return { angle: (s.angle + velocity * dt + 360) % 360, velocity }
}

/** Integrates over `duration` in fixed sub-steps for stability regardless of frame rate. */
export function advanceMarble(
  s: MarbleState,
  lowAngle: number,
  duration: number,
  step = 1 / 240,
): MarbleState {
  let state = s
  for (let t = 0; t < duration; t += step)
    state = stepMarble(state, lowAngle, Math.min(step, duration - t))
  return state
}
