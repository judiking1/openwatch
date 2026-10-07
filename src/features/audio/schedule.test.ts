import { describe, expect, it } from 'vitest'
import { listenerGain, MAX_EVENTS_PER_FRAME, soundEvents } from './schedule'

describe('sound schedule', () => {
  it('beats 8 times a second at 28 800 bph, alternating tick and tock', () => {
    const events = soundEvents({ kind: 'escapement', beatsPerHour: 28_800 }, 0, 500)
    expect(events.map((e) => e.at)).toEqual([125, 250, 375, 500])
    expect(events.map((e) => e.accent)).toEqual([false, true, false, true])
  })

  it('drops once a second at the impact offset', () => {
    expect(soundEvents({ kind: 'drop', offset: 0.55 }, 0, 2000).map((e) => e.at)).toEqual([
      550, 1550,
    ])
  })

  it('ratchets on minute changes only', () => {
    expect(soundEvents({ kind: 'ratchet' }, 59_000, 61_000).map((e) => e.at)).toEqual([60_000])
    expect(soundEvents({ kind: 'ratchet' }, 61_000, 119_000)).toEqual([])
  })

  it('caps the events of a fast-forwarded frame and ignores jumps backwards', () => {
    expect(soundEvents({ kind: 'escapement' }, 0, 60_000)).toHaveLength(MAX_EVENTS_PER_FRAME)
    expect(soundEvents({ kind: 'escapement' }, 1000, 0)).toEqual([])
    expect(soundEvents({ kind: 'quiet' }, 0, 10_000)).toEqual([])
  })

  it('is louder up close and from the caseback', () => {
    expect(listenerGain(3, false)).toBeGreaterThan(listenerGain(10, false))
    expect(listenerGain(6, true)).toBeGreaterThan(listenerGain(6, false))
  })
})
