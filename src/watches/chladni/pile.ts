import { PLATE_RADIUS } from './plate'

/**
 * Sand piles up instead of passing through itself: grains are binned into a height grid
 * every step and slide down its slope (granular spreading, the simplest stand-in for
 * grain–grain contact). The same total volume is shared by however many grains there are,
 * so 4 000 CPU grains and 32 768 GPU grains build the same ridges.
 */
export const GRID = 96
/** Total sand volume, dial units³ (ridges ≈ 2–3 units high, steep enough to slide). */
export const SAND_VOLUME = 2000
/** Spreading speed per unit of slope beyond the angle of repose, units/s. */
export const PILE = 80
/** Sand slopes steeper than this (tan of a 34° angle of repose) slide; gentler ones hold. */
export const REPOSE = Math.tan((34 * Math.PI) / 180)
export const CELL = (2 * PLATE_RADIUS) / GRID

export type SandGrid = { heights: Float32Array; counts: Float32Array }

export function createGrid(): SandGrid {
  return { heights: new Float32Array(GRID * GRID), counts: new Float32Array(GRID * GRID) }
}

/** Grid cell of a dial position (clamped to the grid). */
export function cellOf(v: number) {
  return Math.min(GRID - 1, Math.max(0, Math.floor((v + PLATE_RADIUS) / CELL)))
}

/**
 * Bins the grains into the grid and turns counts into heights, lightly blurred (3×3) so that
 * a few hundred grains already read as a smooth ridge.
 */
export function depositSand(grains: Float32Array, grid: SandGrid) {
  const { counts, heights } = grid
  counts.fill(0)
  for (let i = 0; i < grains.length; i += 2) {
    counts[cellOf(grains[i + 1]) * GRID + cellOf(grains[i])] += 1
  }
  const perGrain = SAND_VOLUME / (grains.length / 2) / (CELL * CELL)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      let sum = 0
      let weight = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= GRID) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= GRID) continue
          const w = (dx ? 1 : 2) * (dy ? 1 : 2)
          sum += counts[yy * GRID + xx] * w
          weight += w
        }
      }
      heights[y * GRID + x] = (sum / weight) * perGrain
    }
  }
}

/** Height of the pile at a dial position (nearest cell): grains rest on top of it. */
export function heightAt(grid: SandGrid, x: number, y: number) {
  return grid.heights[cellOf(y) * GRID + cellOf(x)]
}

/** Height slope at a dial position (central differences on the grid), written to `out`. */
export function heightSlope(grid: SandGrid, x: number, y: number, out = { x: 0, y: 0 }) {
  const h = grid.heights
  const cx = cellOf(x)
  const cy = cellOf(y)
  const at = (i: number, j: number) =>
    h[Math.min(GRID - 1, Math.max(0, j)) * GRID + Math.min(GRID - 1, Math.max(0, i))]
  out.x = (at(cx + 1, cy) - at(cx - 1, cy)) / (2 * CELL)
  out.y = (at(cx, cy + 1) - at(cx, cy - 1)) / (2 * CELL)
  return out
}
