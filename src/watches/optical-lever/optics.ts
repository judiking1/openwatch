import { degToRad } from '../../utils/time'

export type Vec2 = { x: number; y: number }

/** Unit vector for a dial angle (clockwise from 12, y up). */
export function dialVector(angleDeg: number): Vec2 {
  const a = degToRad(angleDeg)
  return { x: Math.sin(a), y: Math.cos(a) }
}

/** Mirror reflection of direction d about unit normal n: d − 2(d·n)n. */
export function reflect(d: Vec2, n: Vec2): Vec2 {
  const k = 2 * (d.x * n.x + d.y * n.y)
  return { x: d.x - k * n.x, y: d.y - k * n.y }
}

/** All lasers enter from 6 o'clock heading to 12. */
export const INCOMING: Vec2 = { x: 0, y: 1 }

/**
 * Optical lever: to send the beam to dial angle θ the mirror normal must point at
 * 90° + θ/2 — the mirror turns at half the speed of the beam it steers.
 */
export function mirrorNormalAngle(beamAngle: number): number {
  return 90 + beamAngle / 2
}
