import { describe, expect, it } from 'vitest'
import { qrModules } from './snapshotCard'

describe('snapshot card QR', () => {
  it('encodes a share link as a square symbol with the three finder patterns', () => {
    const m = qrModules(
      'https://judiking1.github.io/openwatch/#/watch/iris?a=0-c9a96e_4-2&t=10%3A08%3A37',
    )
    const n = m.length
    expect(n).toBeGreaterThanOrEqual(21)
    expect((n - 17) % 4).toBe(0)
    for (const [r, c] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ]) {
      // Finder pattern: dark outer ring, light ring, dark 3×3 centre.
      expect(m[r][c]).toBe(true)
      expect(m[r + 1][c + 1]).toBe(false)
      expect(m[r + 3][c + 3]).toBe(true)
    }
  })
})
