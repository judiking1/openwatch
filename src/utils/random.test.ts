import { describe, expect, it } from 'vitest'
import { gaussian, hash01, random, randomEvents } from './random'

describe('random', () => {
  it('is deterministic and uniform enough', () => {
    const a = random(7)
    const b = random(7)
    let sum = 0
    for (let i = 0; i < 10000; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      sum += v
    }
    expect(sum / 10000).toBeCloseTo(0.5, 1)
  })

  it('gaussian has unit variance', () => {
    const rand = random(3)
    let sq = 0
    for (let i = 0; i < 10000; i++) sq += gaussian(rand) ** 2
    expect(sq / 10000).toBeCloseTo(1, 1)
  })

  it('hash01 is stateless', () => {
    expect(hash01(42)).toBe(hash01(42))
    expect(hash01(42)).not.toBe(hash01(43))
  })
})

describe('randomEvents', () => {
  it('fires at about the requested rate', () => {
    const events = randomEvents(0, 60_000, 6)
    expect(events.length).toBeGreaterThan(300)
    expect(events.length).toBeLessThan(420)
  })

  it('splits a span without losing or repeating events', () => {
    const whole = randomEvents(1000, 5000, 8)
    const parts = [
      ...randomEvents(1000, 2333, 8),
      ...randomEvents(2333, 4100, 8),
      ...randomEvents(4100, 5000, 8),
    ]
    expect(parts).toEqual(whole)
    for (const at of whole) {
      expect(at).toBeGreaterThan(1000)
      expect(at).toBeLessThanOrEqual(5000)
    }
  })

  it('is empty for an empty or backwards span', () => {
    expect(randomEvents(5000, 5000, 10)).toEqual([])
    expect(randomEvents(5000, 4000, 10)).toEqual([])
  })
})
