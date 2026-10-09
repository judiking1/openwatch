import { describe, expect, it } from 'vitest'
import { angleDistance } from '../../utils/time'
import { HOUR_RING, HOUR_WAVE, MINUTE_RING, MINUTE_WAVE, polar } from './phase'
import {
  aimWaves,
  amplitudeAt,
  cellCentre,
  createWaveSim,
  DAMPING,
  ringPeak,
  stepWave,
  strongestAngle,
  WALL,
  writeCrests,
} from './wave'

function warm(n: number, wavelength: number, ring: number, deg: number, seconds: number) {
  const sim = createWaveSim(n, wavelength)
  aimWaves(sim, polar(ring, deg))
  for (let s = 0; s < seconds * 60; s++) stepWave(sim)
  return sim
}

describe('wave equation', () => {
  it('focuses the simulated waves on the hour and the minute', () => {
    for (const deg of [37, 200]) {
      const sim = warm(160, HOUR_WAVE, HOUR_RING, deg, 12)
      expect(angleDistance(strongestAngle(sim, HOUR_RING), deg)).toBeLessThan(2.5)
    }
    const sim = warm(256, MINUTE_WAVE, MINUTE_RING, 243, 18)
    expect(angleDistance(strongestAngle(sim, MINUTE_RING), 243)).toBeLessThan(2)
    // Opposite the focus the waves (direct and reflected) mostly cancel.
    const opposite = polar(MINUTE_RING, 63)
    expect(amplitudeAt(sim, opposite.x, opposite.y) / ringPeak(sim, MINUTE_RING)).toBeLessThan(0.3)
  })

  it('holds the wall: nothing outside it, nothing blows up', () => {
    const sim = warm(96, HOUR_WAVE, HOUR_RING, 0, 20)
    let inside = 0
    for (let j = 0; j < sim.n; j++) {
      for (let i = 0; i < sim.n; i++) {
        const v = sim.cur[j * sim.n + i]
        expect(Number.isFinite(v)).toBe(true)
        if (Math.hypot(cellCentre(sim, i), cellCentre(sim, j)) >= WALL) expect(v).toBe(0)
        else inside = Math.max(inside, Math.abs(v))
      }
    }
    expect(inside).toBeGreaterThan(0)
  })

  it('reflects off the case wall: energy stays in and only damping takes it', () => {
    // With the emitters off, an open dial would empty within ~8 s (c = 12, radius 86). The
    // wall keeps the waves bouncing; only the damping e^(−γt) removes them.
    const sim = warm(128, HOUR_WAVE, HOUR_RING, 0, 8)
    const energy = () => sim.power.reduce((a, p) => a + p, 0)
    const before = energy()
    sim.drive = 0
    for (let s = 0; s < 8 * 60; s++) stepWave(sim)
    const ratio = energy() / before
    expect(ratio).toBeGreaterThan(0.25)
    expect(ratio).toBeLessThan(Math.exp(-DAMPING * 8) * 1.3)
  })

  it('draws crests that are brightest at the focus', () => {
    const sim = warm(160, HOUR_WAVE, HOUR_RING, 90, 12)
    const out = new Uint8Array(sim.n * sim.n * 4)
    let best = 0
    for (let k = 0; k < 60; k++) {
      stepWave(sim)
      writeCrests(sim, ringPeak(sim, HOUR_RING), HOUR_RING, out)
      const i = Math.floor((HOUR_RING + WALL) / sim.dx)
      const j = Math.floor(WALL / sim.dx)
      best = Math.max(best, out[(j * sim.n + i) * 4])
    }
    expect(best).toBeGreaterThan(180)
  })
})
