import { EMITTER_POSITIONS, EMITTERS, FIELD_RADIUS, FREQUENCY, EMITTER_RING } from './phase'

/**
 * The scalar wave equation u_tt = c²∇²u − γu_t + sources, on a square grid over the dial,
 * with a hard wall (u = 0) at the case: waves reflect off it and fade with γ. Leapfrog in
 * time, 5-point Laplacian; the emitters are point forces on their grid cells, driven at
 * `FREQUENCY` with the focusing delays. Pure and framework-free; `waveCompute.ts` runs the
 * same scheme in compute shaders on the WebGPU backend.
 */

/** The wall: waves reflect at the inner edge of the case. */
export const WALL = FIELD_RADIUS + 2
/** Damping (1/s): a reflected wave crossing the dial keeps about a third of its amplitude. */
export const DAMPING = 0.08
/** Simulation step, seconds (well inside the stability limit for both fields). */
export const SIM_DT = 1 / 60
/** Time constant of the running amplitude used for display and reading, seconds. */
export const AMP_TAU = 0.6

export type WaveSim = {
  n: number
  dx: number
  /** Wave speed: wavelength × frequency. */
  c: number
  wavelength: number
  /** Field one step ago, now (leapfrog), and the running mean of u². */
  prev: Float32Array
  cur: Float32Array
  power: Float32Array
  /** 1 inside the wall, 0 outside. */
  inside: Uint8Array
  /** Grid cell of each emitter and its drive phase (radians). */
  sourceCell: Int32Array
  sourcePhase: Float32Array
  /** Drive strength, 0..1 (0 switches the emitters off). */
  drive: number
  time: number
}

/** Centre of grid cell `i` along one axis, dial units. */
export function cellCentre(sim: Pick<WaveSim, 'n' | 'dx'>, i: number) {
  return (i + 0.5) * sim.dx - WALL
}

export function createWaveSim(n: number, wavelength: number): WaveSim {
  const dx = (2 * WALL) / n
  const inside = new Uint8Array(n * n)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * dx - WALL
      const y = (j + 0.5) * dx - WALL
      inside[j * n + i] = Math.hypot(x, y) < WALL ? 1 : 0
    }
  }
  const sourceCell = new Int32Array(EMITTERS)
  EMITTER_POSITIONS.forEach((p, k) => {
    const i = Math.floor((p.x + WALL) / dx)
    const j = Math.floor((p.y + WALL) / dx)
    sourceCell[k] = j * n + i
  })
  return {
    n,
    dx,
    c: wavelength * FREQUENCY,
    wavelength,
    prev: new Float32Array(n * n),
    cur: new Float32Array(n * n),
    power: new Float32Array(n * n),
    inside,
    sourceCell,
    sourcePhase: new Float32Array(EMITTERS),
    drive: 1,
    time: 0,
  }
}

/**
 * Drive phases that focus the array on `focus`, measured from the emitters' actual grid
 * cells (so the grid's rounding of their positions costs no focus).
 */
export function aimWaves(sim: WaveSim, focus: { x: number; y: number }) {
  const k = (2 * Math.PI) / sim.wavelength
  for (let e = 0; e < EMITTERS; e++) {
    const c = sim.sourceCell[e]
    const x = cellCentre(sim, c % sim.n)
    const y = cellCentre(sim, Math.floor(c / sim.n))
    sim.sourcePhase[e] = -k * Math.hypot(focus.x - x, focus.y - y)
  }
}

/** Strength of each emitter's force (arbitrary units; display and reading normalise). */
export const SOURCE = 400

/** Advances the field by one `SIM_DT` step. */
export function stepWave(sim: WaveSim) {
  const { n, prev, cur, inside, power } = sim
  const dt = SIM_DT
  const r2 = (sim.c * dt) ** 2 / (sim.dx * sim.dx)
  const damp = (DAMPING * dt) / 2
  const keep = 1 - Math.exp(-dt / AMP_TAU)
  // prev is overwritten in place: each cell's new value needs only its own old value.
  for (let j = 1; j < n - 1; j++) {
    for (let i = 1; i < n - 1; i++) {
      const c = j * n + i
      if (!inside[c]) continue
      const lap = cur[c - 1] + cur[c + 1] + cur[c - n] + cur[c + n] - 4 * cur[c]
      prev[c] = (2 * cur[c] - prev[c] * (1 - damp) + r2 * lap) / (1 + damp)
    }
  }
  const w = 2 * Math.PI * FREQUENCY * (sim.time + dt)
  for (let e = 0; e < EMITTERS; e++) {
    prev[sim.sourceCell[e]] += sim.drive * SOURCE * dt * dt * Math.cos(w - sim.sourcePhase[e])
  }
  sim.prev = cur
  sim.cur = prev
  sim.time += dt
  const next = sim.cur
  for (let c = 0; c < n * n; c++) power[c] += (next[c] * next[c] - power[c]) * keep
}

/** Running wave amplitude at a dial point (nearest cell). */
export function amplitudeAt(sim: WaveSim, x: number, y: number) {
  const i = Math.min(sim.n - 1, Math.max(0, Math.floor((x + WALL) / sim.dx)))
  const j = Math.min(sim.n - 1, Math.max(0, Math.floor((y + WALL) / sim.dx)))
  return Math.sqrt(2 * sim.power[j * sim.n + i])
}

/** Clock angle of the strongest point on a ring: how the dial is read. */
export function strongestAngle(sim: WaveSim, radius: number, steps = 720) {
  let best = 0
  let bestA = -1
  for (let s = 0; s < steps; s++) {
    const deg = (s * 360) / steps
    const a = (deg * Math.PI) / 180
    const amp = amplitudeAt(sim, radius * Math.sin(a), radius * Math.cos(a))
    if (amp > bestA) {
      bestA = amp
      best = deg
    }
  }
  return best
}

/** Largest running amplitude on a ring (the focus), used to normalise the display. */
export function ringPeak(sim: WaveSim, radius: number, steps = 360) {
  let peak = 1e-9
  for (let s = 0; s < steps; s++) {
    const a = (s * 2 * Math.PI) / steps
    peak = Math.max(peak, amplitudeAt(sim, radius * Math.sin(a), radius * Math.cos(a)))
  }
  return peak
}

/**
 * Waves from the emitter ring lose amplitude like 1/√distance. For display, amplitude near
 * the emitters is scaled down by that much relative to the focus ring.
 */
export function spreading(r: number, ring: number) {
  return Math.sqrt(Math.min(1, Math.max(0.02, (r - EMITTER_RING) / (ring - EMITTER_RING))))
}

/**
 * The instantaneous wave as crests, white on black, into an RGBA image of the grid: full
 * contrast everywhere so the ripples read, weighted by (amplitude / focus amplitude)² so the
 * focus wins. Close to the emitters every wave is strong; `spreading` discounts that, so the
 * eye goes to the focus and not to the source. Faded at the wall and inside the emitter ring.
 */
export function writeCrests(sim: WaveSim, peak: number, ring: number, out: Uint8Array) {
  const { n, cur, power } = sim
  for (let j = 0; j < n; j++) {
    const y = cellCentre(sim, j)
    for (let i = 0; i < n; i++) {
      const c = j * n + i
      const x = cellCentre(sim, i)
      const r = Math.hypot(x, y)
      const fade =
        Math.min(1, Math.max(0, (FIELD_RADIUS - r) / 4)) *
        Math.min(1, Math.max(0, (r - EMITTER_RING - 3) / 5))
      const amp = Math.sqrt(2 * power[c]) + 1e-9
      const v = cur[c] / amp
      const crest = v > 0 ? Math.min(1, v * v) : 0
      const rel = Math.min(1, (amp / peak) * spreading(r, ring))
      const byte = Math.round(255 * crest * (0.18 + 0.82 * rel * rel) * fade)
      out[c * 4] = out[c * 4 + 1] = out[c * 4 + 2] = byte
      out[c * 4 + 3] = 255
    }
  }
}
