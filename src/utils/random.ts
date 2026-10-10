/** Deterministic pseudo-random numbers in [0, 1) (mulberry32): the same on every load. */
export function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal sample (Box–Muller) from a uniform source. */
export function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

/** Integer hash to [0, 1) (stateless: the same slot always gives the same value). */
export function hash01(n: number) {
  let t = (Math.imul(n | 0, 0x9e3779b1) + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Width of the slots that `randomEvents` draws from, ms. */
const SLOT = 25

/**
 * Random event times in (from, to] (ms), about `rate` per second, as a pure function of
 * time: whoever asks about the same span gets the same events. That is how a watch's
 * random strikes and their sound stay in sync without sharing state.
 */
export function randomEvents(from: number, to: number, rate: number, seed = 0): number[] {
  if (to <= from) return []
  const chance = (rate * SLOT) / 1000
  const events: number[] = []
  for (let k = Math.floor(from / SLOT); k <= Math.floor(to / SLOT); k++) {
    if (hash01(k * 2 + seed * 7919) >= chance) continue
    const at = (k + hash01(k * 2 + 1 + seed * 7919)) * SLOT
    if (at > from && at <= to) events.push(at)
  }
  return events
}
