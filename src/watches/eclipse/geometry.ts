import { Path, Shape } from 'three'
import { degToRad } from '../../utils/time'

export const ECLIPSE = {
  hourDisc: { inner: 20, outer: 72, apertureRadius: 58, apertureSize: 11 },
  minuteDisc: { inner: 74, outer: 100, window: { inner: 79, outer: 98, halfAngle: 18 } },
  minuteScale: { numeralRadius: 85, tickInner: 92, tickOuter: 97 },
  sun: 12,
  moon: { radius: 10, orbit: 7 },
} as const

/** Dial angle (clockwise from 12) → math angle (anticlockwise from +x) in radians. */
function mathAngle(dialDeg: number): number {
  return degToRad(90 - dialDeg)
}

export function circleHole(radius: number, size: number): Path {
  return new Path().absarc(0, radius, size, 0, Math.PI * 2, true)
}

/** Annular-sector window centred on 12 o'clock. */
export function sectorHole(inner: number, outer: number, halfAngleDeg: number): Path {
  const a0 = mathAngle(-halfAngleDeg)
  const a1 = mathAngle(halfAngleDeg)
  const p = new Path()
  p.absarc(0, 0, outer, a0, a1, true)
  p.absarc(0, 0, inner, a1, a0, false)
  p.closePath()
  return p
}

/** Annulus with a centre hole plus the given aperture(s), drawn at 12 o'clock. */
export function apertureDiscShape(inner: number, outer: number, ...apertures: Path[]): Shape {
  const shape = new Shape().absarc(0, 0, outer, 0, Math.PI * 2, false) as Shape
  shape.holes.push(new Path().absarc(0, 0, inner, 0, Math.PI * 2, true), ...apertures)
  return shape
}
