import type { ClockTime } from '../../utils/time'

/** Seconds the vessel takes to siphon empty at the start of each 시진. */
export const FLUSH_SECONDS = 4
/** A drop leaves the spout every second and lands at this fraction of the second. */
export const DROP_IMPACT = 0.55

export type WaterClockState = {
  /** 0 = 자시 (23:00–01:00) … 11 = 해시. */
  sijin: number
  half: '초' | '정'
  /** 0..1 through the current 시진 (two hours). */
  progress: number
  /** 0..7 — the eight 각 (15 minutes each) of a 시진. */
  gak: number
  /** 0..1 while the vessel is emptying, otherwise null. */
  flush: number | null
  /** Water level in the vessel, 0..1. */
  level: number
}

const ease = (x: number) => x * x * (3 - 2 * x)

export function waterClock(t: ClockTime): WaterClockState {
  const seconds = ((t.hours + 1) % 24) * 3600 + t.minutes * 60 + t.seconds + t.milliseconds / 1000
  const sijin = Math.floor(seconds / 7200)
  const elapsed = seconds - sijin * 7200
  const progress = elapsed / 7200
  const flush = elapsed < FLUSH_SECONDS ? elapsed / FLUSH_SECONDS : null
  return {
    sijin,
    half: elapsed < 3600 ? '초' : '정',
    progress,
    gak: Math.min(7, Math.floor(progress * 8)),
    flush,
    level: flush === null ? progress : (1 - ease(flush)) * (1 - progress) + progress,
  }
}

/** Height of the falling drop as a fraction of its fall (0 = spout, 1 = surface), or null. */
export function dropFall(t: ClockTime): number | null {
  const phase = t.milliseconds / 1000
  return phase < DROP_IMPACT ? (phase / DROP_IMPACT) ** 2 : null
}

/** Eight 각 labels of a 시진: 初初刻 … 正三刻. */
export const GAK_LABELS = ['初初', '初一', '初二', '初三', '正初', '正一', '正二', '正三']

/** Clock time of the 각 boundary `quarter` (0..8) in 시진 `sijin`: e.g. (5, 2) → '9:30'. */
export function gakClockTime(sijin: number, quarter: number): string {
  const minutes = ((sijin * 2 + 23) % 24) * 60 + quarter * 15
  const h = Math.floor(minutes / 60) % 24
  return `${h}:${String(minutes % 60).padStart(2, '0')}`
}
