import { Path, Shape } from 'three'
import { dialPoint3 } from '../../three/utils/dial'

export const ECLIPSE = {
  hourDisc: { inner: 20, outer: 72, apertureRadius: 58, apertureSize: 11 },
  minuteDisc: { inner: 74, outer: 100, apertureRadius: 88, apertureSize: 8 },
  sun: 12,
  moon: { radius: 10, orbit: 7 },
} as const

function circlePath(path: Path, x: number, y: number, r: number, clockwise: boolean) {
  path.absarc(x, y, r, 0, Math.PI * 2, clockwise)
  return path
}

/**
 * Annulus with one round aperture, drawn with the aperture at 12 o'clock
 * (rotate the mesh by the hand angle to place it).
 */
export function apertureDiscShape(
  inner: number,
  outer: number,
  apertureRadius: number,
  apertureSize: number,
): Shape {
  const shape = circlePath(new Shape(), 0, 0, outer, false) as Shape
  shape.holes.push(circlePath(new Path(), 0, 0, inner, true))
  const [x, y] = dialPoint3(apertureRadius, 0)
  shape.holes.push(circlePath(new Path(), x, y, apertureSize, true))
  return shape
}
