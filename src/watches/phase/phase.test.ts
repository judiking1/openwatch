import { describe, expect, it } from 'vitest'
import {
  amplitude,
  brightestAngle,
  createGrid,
  focusField,
  focusPhases,
  HOUR_RING,
  HOUR_WAVE,
  MINUTE_RING,
  MINUTE_WAVE,
  phasePose,
  polar,
  writeWave,
} from './phase'

const t = (hours: number, minutes: number, seconds = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds: 0,
})

const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

describe('phase', () => {
  it('aims the foci at the hour and minute', () => {
    const p = phasePose(t(15, 40, 30))
    expect(p.hour).toBeCloseTo(110.25, 6)
    expect(p.minute).toBeCloseTo(243, 6)
    expect(p.second).toBeCloseTo(180, 6)
  })

  it('every wave arrives in step at the focus', () => {
    const focus = polar(MINUTE_RING, 243)
    const phases = focusPhases(focus, MINUTE_WAVE)
    expect(amplitude(focus.x, focus.y, phases, MINUTE_WAVE)).toBeCloseTo(1, 5)
  })

  it('the brightest point of each ring reads back the time', () => {
    for (const [h, m] of [
      [3, 40],
      [10, 8],
      [12, 0],
      [6, 59],
    ]) {
      const pose = phasePose(t(h, m))
      const hp = focusPhases(polar(HOUR_RING, pose.hour), HOUR_WAVE)
      const mp = focusPhases(polar(MINUTE_RING, pose.minute), MINUTE_WAVE)
      expect(angleDiff(brightestAngle(HOUR_RING, hp, HOUR_WAVE), pose.hour)).toBeLessThan(0.5)
      expect(angleDiff(brightestAngle(MINUTE_RING, mp, MINUTE_WAVE), pose.minute)).toBeLessThan(0.5)
    }
  })

  it('the focus stands out: elsewhere on the ring the waves mostly cancel', () => {
    for (const [ring, wave] of [
      [HOUR_RING, HOUR_WAVE],
      [MINUTE_RING, MINUTE_WAVE],
    ]) {
      const phases = focusPhases(polar(ring, 0), wave)
      let side = 0
      for (let deg = 30; deg <= 330; deg += 0.5) {
        const p = polar(ring, deg)
        side = Math.max(side, amplitude(p.x, p.y, phases, wave))
      }
      expect(side).toBeLessThan(0.45)
    }
  })

  it('draws crests that flash at the focus once a second', () => {
    const grid = createGrid(64)
    const cells = 64 * 64
    const re = new Float32Array(cells)
    const im = new Float32Array(cells)
    focusField(grid, focusPhases(polar(MINUTE_RING, 90), MINUTE_WAVE), MINUTE_WAVE, re, im)
    const out = new Uint8Array(cells * 4)
    // Cell nearest the focus (x = 74, y = 0).
    const i = Math.floor(((74 + 84) / 168) * 64)
    const j = Math.floor((84 / 168) * 64)
    const c = j * 64 + i
    let lo = 255
    let hi = 0
    for (let s = 0; s < 1; s += 0.05) {
      writeWave(grid, re, im, s, out)
      lo = Math.min(lo, out[c * 4])
      hi = Math.max(hi, out[c * 4])
    }
    expect(hi).toBeGreaterThan(150)
    expect(lo).toBeLessThan(20)
  })
})
