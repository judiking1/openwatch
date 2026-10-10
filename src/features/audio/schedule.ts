import type { SoundProfile } from '../../types/watch'
import { hash01, randomEvents } from '../../utils/random'

export const DEFAULT_SOUND: SoundProfile = { kind: 'escapement', beatsPerHour: 28_800 }

/** Events of one profile in (from, to], as clock times in ms. */
export type SoundEvent = { at: number; accent: boolean }

/** At most this many events are voiced per frame; beyond that the rate is a blur anyway. */
export const MAX_EVENTS_PER_FRAME = 4

function periodic(from: number, to: number, period: number, offset: number): SoundEvent[] {
  if (to <= from) return []
  const first = Math.floor((from - offset) / period) + 1
  const last = Math.floor((to - offset) / period)
  const events: SoundEvent[] = []
  for (let k = first; k <= last && events.length < MAX_EVENTS_PER_FRAME; k++) {
    events.push({ at: k * period + offset, accent: k % 2 === 0 })
  }
  return events
}

/**
 * The sound events between two clock instants. Follows the watch's own time, so paused,
 * scrubbed and fast-forwarded clocks sound accordingly (a jump backwards is silent).
 */
export function soundEvents(profile: SoundProfile, from: number, to: number): SoundEvent[] {
  switch (profile.kind) {
    case 'escapement':
      return periodic(from, to, 3_600_000 / (profile.beatsPerHour ?? 28_800), 0)
    case 'drop':
      return periodic(from, to, 1000, profile.offset * 1000)
    case 'ratchet':
      return periodic(from, to, 60_000, 0)
    case 'crackle':
      // The same pure function of time the watch uses for its visible strikes.
      return randomEvents(from, to, profile.rate)
        .slice(0, MAX_EVENTS_PER_FRAME)
        .map((at) => ({ at, accent: hash01(Math.round(at)) > 0.7 }))
    case 'quiet':
      return []
  }
}

/** Loudness from the camera's distance (stage units) and whether the caseback faces it. */
export function listenerGain(distance: number, fromBack: boolean) {
  const near = Math.min(1.4, Math.max(0.15, 5.5 / distance))
  return near * (fromBack ? 1.4 : 1)
}
