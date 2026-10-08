/**
 * In-plane gravity felt by free parts of a watch (rolling marbles, sand), in dial
 * coordinates (x right, y toward 12), as sin(tilt angle) — 0 when lying flat, 1 on edge.
 * Written each frame by `TiltController`, read by concepts in their frame loop.
 */
export const tilt = { x: 0, y: 0 }

/** Gravity's direction as a clock angle (degrees clockwise from 12) and its strength. */
export function tiltPolar(t: { x: number; y: number } = tilt) {
  const strength = Math.hypot(t.x, t.y)
  const angle = ((Math.atan2(t.x, t.y) * 180) / Math.PI + 360) % 360
  return { angle, strength }
}

/** Viewing angles within this (sin of ~25°) count as level: ordinary inspection changes nothing. */
export const VIEW_DEAD_ZONE = 0.42
/** Beyond the dead zone the view tilts the watch gently: a 60° side view ≈ 7° of tilt. */
export const VIEW_GAIN = 0.15

/**
 * Tilt from the viewing direction: the watch is treated as lying face-up toward the camera,
 * so looking at it from far to the side means its far side is raised. `d` is the unit vector
 * from the watch to the camera in the watch's own frame.
 */
export function tiltFromView(d: { x: number; y: number; z: number }) {
  const oblique = Math.hypot(d.x, d.y)
  if (oblique <= VIEW_DEAD_ZONE) return { x: 0, y: 0 }
  const strength = ((oblique - VIEW_DEAD_ZONE) / (1 - VIEW_DEAD_ZONE)) * VIEW_GAIN
  return { x: (-d.x / oblique) * strength, y: (-d.y / oblique) * strength }
}

/**
 * Tilt from a phone's orientation (DeviceOrientationEvent, degrees): beta is the front-back
 * tilt, gamma the left-right tilt; a phone lying flat gives no in-plane gravity.
 */
export function tiltFromDevice(beta: number, gamma: number) {
  const rad = Math.PI / 180
  return { x: Math.sin(gamma * rad), y: -Math.sin(beta * rad) }
}
