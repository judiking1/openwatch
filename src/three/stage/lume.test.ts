import { describe, expect, it } from 'vitest'
import { isLuminous, lightScale, NIGHT_LIGHT } from './lume'

describe('lume view', () => {
  it('fades studio light from full to the night floor', () => {
    expect(lightScale(0)).toBe(1)
    expect(lightScale(1)).toBeCloseTo(NIGHT_LIGHT)
    expect(lightScale(0.5)).toBeGreaterThan(NIGHT_LIGHT)
  })

  it('treats tagged prints and parts of the hands as luminous', () => {
    const names = (o: unknown) => (o as { path: string[] }).path
    const part = (path: string[], lume = false) => ({
      name: '',
      parent: null,
      userData: { lume },
      path,
    })
    expect(isLuminous(part([], true), names)).toBe(true)
    expect(isLuminous(part(['watch', 'minute', 'tip']), names)).toBe(true)
    expect(isLuminous(part(['watch', 'dial']), names)).toBe(false)
  })
})
