import { PlaneGeometry } from 'three'
import { CELL, GRID, PLATE_RADIUS } from './sand'

/** Plate surface (top of the plate cylinder); sand of zero height sits just below it. */
export const SAND_BASE_Z = 0.55

/**
 * A grid of vertices on the sand-grid cell centres (row 0 at the top, as `PlaneGeometry`
 * lays them out). Vertex `row * GRID + col` is cell `(col, GRID − 1 − row)`.
 */
export function createHeightfieldGeometry() {
  const size = 2 * PLATE_RADIUS - CELL
  return new PlaneGeometry(size, size, GRID - 1, GRID - 1)
}

/** Whether a cell centre lies on the plate (sand outside it is never drawn). */
export function onPlate(col: number, cell: number) {
  const x = (col + 0.5) * CELL - PLATE_RADIUS
  const y = (cell + 0.5) * CELL - PLATE_RADIUS
  return Math.hypot(x, y) < PLATE_RADIUS - CELL
}

/** Writes the sand heights into the heightfield's z coordinates (dial units). */
export function writeHeightfield(geometry: PlaneGeometry, heights: Float32Array) {
  const position = geometry.getAttribute('position')
  const z = position.array as Float32Array
  for (let row = 0; row < GRID; row++) {
    const cell = GRID - 1 - row
    for (let col = 0; col < GRID; col++) {
      const h = onPlate(col, cell) ? heights[cell * GRID + col] : -1
      z[(row * GRID + col) * 3 + 2] = SAND_BASE_Z + h
    }
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}
