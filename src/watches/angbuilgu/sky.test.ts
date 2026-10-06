import { describe, expect, it } from 'vitest'
import {
  declinationFromLongitude,
  LATITUDE,
  nightWatch,
  poleVector,
  shadowOnSphere,
  sijin,
  solarTerm,
  sunVector,
} from './sky'

const len = (v: { x: number; y: number; z: number }) => Math.hypot(v.x, v.y, v.z)

describe('angbuilgu sky model', () => {
  it('puts the equinox noon sun due south at altitude 90° − latitude', () => {
    const s = sunVector(12, 0)
    expect(s.x).toBeCloseTo(0, 9)
    expect(s.y).toBeLessThan(0)
    expect((Math.asin(s.z) * 180) / Math.PI).toBeCloseTo(90 - LATITUDE, 6)
    expect(len(s)).toBeCloseTo(1, 9)
  })

  it('has the morning sun in the east and the afternoon sun in the west', () => {
    expect(sunVector(9, 10).x).toBeGreaterThan(0)
    expect(sunVector(15, 10).x).toBeLessThan(0)
  })

  it('rises and sets at 6:00 / 18:00 on the equinox', () => {
    expect(sunVector(6, 0).z).toBeCloseTo(0, 9)
    expect(sunVector(18, 0).z).toBeCloseTo(0, 9)
  })

  it('casts the gnomon-tip shadow at −R·sun inside the bowl', () => {
    const sun = sunVector(10, 15)
    const p = shadowOnSphere({ x: 0, y: 0, z: 0 }, sun, 80)
    expect(p.x).toBeCloseTo(-80 * sun.x, 9)
    expect(p.z).toBeLessThan(0)
    expect(len(p)).toBeCloseTo(80, 9)
  })

  it('casts the whole needle onto the sphere', () => {
    const pole = poleVector()
    const q = { x: pole.x * 30, y: pole.y * 30, z: pole.z * 30 }
    expect(len(shadowOnSphere(q, sunVector(14, -5), 80))).toBeCloseTo(80, 9)
  })

  it('maps solstices to ±23.44° declination', () => {
    expect(declinationFromLongitude(90)).toBeCloseTo(23.44, 6)
    expect(declinationFromLongitude(270)).toBeCloseTo(-23.44, 6)
  })

  it('names 시진, solar terms and night watches', () => {
    expect(sijin(7.75)).toEqual({ index: 4, half: '초' })
    expect(sijin(12.5)).toEqual({ index: 6, half: '정' })
    expect(sijin(23.5)).toEqual({ index: 0, half: '초' })
    expect(solarTerm(91)).toBe('하지')
    expect(solarTerm(271)).toBe('동지')
    expect(nightWatch(21.5)?.watch).toBe(2)
    expect(nightWatch(12)).toBeNull()
  })
})
