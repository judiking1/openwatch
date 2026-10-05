import type { ClockTime } from '../../utils/time'

/** One radial slice (top, middle or bottom third of the glyphs) of a group. */
export type CipherBand = { inner: number; outer: number }

export type CipherGroup = {
  id: 'hour' | 'tens' | 'units'
  /** Glyphs on each ring, in value order. */
  glyphs: string[]
  /** Radius of the glyph centre. */
  centre: number
  fontSize: number
  /** Outer → inner bands; together they cover the glyph height. */
  bands: [CipherBand, CipherBand, CipherBand]
  /**
   * Slot → value index for each band's ring. Fixed permutations chosen so the three
   * rings agree only at the reading window (verified in cipher.test.ts).
   */
  permutations: [number[], number[], number[]]
}

export const CIPHER: CipherGroup[] = [
  {
    id: 'hour',
    glyphs: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    centre: 83.5,
    fontSize: 24,
    bands: [
      { inner: 87, outer: 97 },
      { inner: 80, outer: 87 },
      { inner: 70, outer: 80 },
    ],
    permutations: [
      [7, 0, 8, 6, 11, 10, 1, 3, 2, 5, 4, 9],
      [7, 0, 9, 10, 1, 11, 6, 8, 3, 2, 4, 5],
      [8, 4, 0, 5, 3, 11, 6, 9, 1, 10, 2, 7],
    ],
  },
  {
    id: 'tens',
    glyphs: ['0', '1', '2', '3', '4', '5'],
    centre: 56,
    fontSize: 22,
    bands: [
      { inner: 59.5, outer: 68 },
      { inner: 52.5, outer: 59.5 },
      { inner: 45, outer: 52.5 },
    ],
    permutations: [
      [5, 3, 0, 2, 1, 4],
      [4, 0, 3, 1, 5, 2],
      [4, 2, 5, 0, 1, 3],
    ],
  },
  {
    id: 'units',
    glyphs: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    centre: 31,
    fontSize: 20,
    bands: [
      { inner: 34.5, outer: 42 },
      { inner: 27.5, outer: 34.5 },
      { inner: 20, outer: 27.5 },
    ],
    permutations: [
      [7, 1, 3, 9, 4, 6, 8, 2, 0, 5],
      [2, 7, 6, 4, 5, 9, 8, 3, 0, 1],
      [4, 1, 6, 8, 9, 7, 5, 3, 0, 2],
    ],
  },
]

/** Value index each group must show. Seconds are deliberately not displayed. */
export function cipherValues(t: ClockTime): Record<CipherGroup['id'], number> {
  const h12 = t.hours % 12 === 0 ? 12 : t.hours % 12
  return {
    hour: h12 - 1,
    tens: Math.floor(t.minutes / 10),
    units: t.minutes % 10,
  }
}

export function slotAngle(group: CipherGroup, slot: number): number {
  return (slot * 360) / group.glyphs.length
}

/**
 * Target rotation (dial degrees) of each of a group's three rings so the slot holding
 * `value` sits in the reading window at twelve.
 */
export function ringTargets(group: CipherGroup, value: number): [number, number, number] {
  return group.permutations.map((p) => -slotAngle(group, p.indexOf(value))) as [
    number,
    number,
    number,
  ]
}

/** Shortest signed step from `from` to `to`, in degrees. */
export function shortestDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180
}
