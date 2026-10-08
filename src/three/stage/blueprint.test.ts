import { describe, expect, it } from 'vitest'
import { CASE_DIAMETER_UNITS, formatMm, toMillimetres } from './blueprint'

describe('blueprint scale', () => {
  it('draws the case as a 40 mm watch', () => {
    expect(toMillimetres(CASE_DIAMETER_UNITS)).toBe(40)
    expect(formatMm(200)).toBe('35.1 mm')
  })
})
