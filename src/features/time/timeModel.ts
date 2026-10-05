/**
 * Framework-free model of the watch clock.
 *
 * The displayed time is `anchorSimMs + (nowMs - anchorRealMs) * speed`, so
 * changing speed or setting a manual time never causes a jump: we simply
 * re-anchor at the current displayed time.
 */
export type TimeMode = 'live' | 'simulated'

export type TimeModel = {
  mode: TimeMode
  speed: number
  paused: boolean
  anchorRealMs: number
  anchorSimMs: number
}

export function createLiveModel(nowMs: number): TimeModel {
  return { mode: 'live', speed: 1, paused: false, anchorRealMs: nowMs, anchorSimMs: nowMs }
}

export function resolveTime(m: TimeModel, nowMs: number): number {
  if (m.mode === 'live') return nowMs
  if (m.paused) return m.anchorSimMs
  return m.anchorSimMs + (nowMs - m.anchorRealMs) * m.speed
}

function reanchor(m: TimeModel, nowMs: number, patch: Partial<TimeModel>): TimeModel {
  return {
    ...m,
    mode: 'simulated',
    anchorRealMs: nowMs,
    anchorSimMs: resolveTime(m, nowMs),
    ...patch,
  }
}

export function setSpeed(m: TimeModel, nowMs: number, speed: number): TimeModel {
  return reanchor(m, nowMs, { speed })
}

export function setPaused(m: TimeModel, nowMs: number, paused: boolean): TimeModel {
  return reanchor(m, nowMs, { paused })
}

export function setManualTime(m: TimeModel, nowMs: number, simMs: number): TimeModel {
  return reanchor(m, nowMs, { anchorSimMs: simMs })
}

export function goLive(nowMs: number): TimeModel {
  return createLiveModel(nowMs)
}
