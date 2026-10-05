import { describe, expect, it } from 'vitest'
import {
  createLiveModel,
  goLive,
  resolveTime,
  setManualTime,
  setPaused,
  setSpeed,
} from './timeModel'

describe('timeModel', () => {
  it('follows the real clock in live mode', () => {
    const m = createLiveModel(1000)
    expect(resolveTime(m, 5000)).toBe(5000)
  })

  it('does not jump when speed changes', () => {
    const m = setSpeed(createLiveModel(1000), 2000, 60)
    expect(m.mode).toBe('simulated')
    expect(resolveTime(m, 2000)).toBe(2000)
    expect(resolveTime(m, 3000)).toBe(2000 + 60_000)
  })

  it('holds time while paused and resumes from there', () => {
    let m = setPaused(createLiveModel(0), 1000, true)
    expect(resolveTime(m, 9000)).toBe(1000)
    m = setPaused(m, 9000, false)
    expect(resolveTime(m, 10_000)).toBe(2000)
  })

  it('sets a manual time that keeps running at the current speed', () => {
    const m = setManualTime(createLiveModel(0), 500, 1_000_000)
    expect(resolveTime(m, 500)).toBe(1_000_000)
    expect(resolveTime(m, 1500)).toBe(1_001_000)
  })

  it('goes back to live', () => {
    expect(resolveTime(goLive(10), 42)).toBe(42)
  })
})
