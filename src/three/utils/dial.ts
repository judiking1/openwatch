import { CanvasTexture, SRGBColorSpace } from 'three'
import { degToRad } from '../../utils/time'

/** Dial angle (clockwise from 12 o'clock) to a Z rotation in a y-up scene. */
export function dialRotationZ(angleDeg: number): number {
  return -degToRad(angleDeg)
}

/** Point on the dial plane (y-up) for a dial angle. */
export function dialPoint3(radius: number, angleDeg: number): [number, number] {
  const a = degToRad(angleDeg)
  return [radius * Math.sin(a), radius * Math.cos(a)]
}

/**
 * Creates a square canvas texture covering a disc of `extent` dial units.
 * The draw callback receives a context already translated to the centre and
 * scaled to dial units, with y pointing down (canvas convention).
 */
export function createDialTexture(
  extent: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  size = 2048,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.translate(size / 2, size / 2)
  ctx.scale(size / (2 * extent), size / (2 * extent))
  draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Every model is authored in dial units: the dial has radius 100, plane z = 0, facing +z. */
export const DIAL_RADIUS = 100
