import { HalfFloatType, LinearFilter, StorageTexture, type WebGPURenderer } from 'three/webgpu'
import {
  atomicMax,
  atomicStore,
  clamp,
  cos,
  float,
  floatBitsToUint,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  int,
  ivec2,
  max,
  min,
  Return,
  sqrt,
  textureStore,
  uint,
  uintBitsToFloat,
  uniform,
  vec4,
  atomicLoad,
} from 'three/tsl'
import { EMITTER_RING, EMITTERS, FIELD_RADIUS, FREQUENCY } from './phase'
import {
  aimWaves,
  AMP_TAU,
  createWaveSim,
  DAMPING,
  FIELD_SHARE,
  setTouch,
  SIM_DT,
  SOURCE,
  TOUCH_FADE,
  TOUCH_STRENGTH,
  WALL,
} from './wave'
import { WAVE_FIELDS, type WaveField, type WaveKind } from './waveField'
import { loose as n, type AnyNode } from '../../three/utils/tsl'

const RING_SAMPLES = 720

/**
 * The same wave equation as `wave.ts`, in compute shaders on the WebGPU backend and at a
 * finer grid: leapfrog step, emitter forces, running power, a ring-peak reduction (atomic
 * max on the float bits, which order like the floats for positive values) and a last kernel
 * that writes the crests into a storage texture. Nothing returns to the CPU.
 */
export function createComputeWaves(kind: WaveKind): WaveField {
  const spec = WAVE_FIELDS[kind]
  const N = spec.gpuN
  const cells = N * N
  // Geometry from the CPU model: wall mask, emitter cells and their focusing phases.
  const geometry = createWaveSim(N, spec.wavelength)
  const a = instancedArray(cells, 'float')
  const b = instancedArray(cells, 'float')
  const power = instancedArray(cells, 'float')
  const inside = instancedArray(Float32Array.from(geometry.inside), 'float')
  // Per source: grid cell, drive phase, weight. The last one is the touch.
  const SOURCES = EMITTERS + 1
  const sources = instancedArray(SOURCES * 3, 'float')
  // Ring peak and field peak (float bits).
  const peak = instancedArray(2, 'uint').toAtomic()
  const u = { w: uniform(0) }

  const texture = new StorageTexture(N, N)
  // Half floats: R3F tags `map` textures sRGB, and 8-bit sRGB formats cannot be storage-bound.
  texture.type = HalfFloatType
  texture.minFilter = texture.magFilter = LinearFilter

  const dx = geometry.dx
  const r2 = (geometry.c * SIM_DT) ** 2 / (dx * dx)
  const damp = (DAMPING * SIM_DT) / 2
  const keep = 1 - Math.exp(-SIM_DT / AMP_TAU)

  const perCell = (body: (i: AnyNode) => void) =>
    Fn(() => {
      If(instanceIndex.greaterThanEqual(cells), () => {
        Return()
      })
      body(int(instanceIndex))
    })().compute(cells, [64])

  /** One leapfrog step: `prev` is overwritten with the next field. */
  const step = (cur: typeof a, prev: typeof a) => [
    perCell((i) => {
      const x = i.mod(N)
      const y = i.div(N)
      const edge = x
        .lessThan(1)
        .or(x.greaterThan(N - 2))
        .or(y.lessThan(1))
        .or(y.greaterThan(N - 2))
      const target = n(prev.element(i))
      If(edge.or(n(inside.element(i)).lessThan(0.5)), () => {
        target.assign(0)
      }).Else(() => {
        const c = n(cur.element(i))
        const lap = n(cur.element(i.sub(1)))
          .add(n(cur.element(i.add(1))))
          .add(n(cur.element(i.sub(N))))
          .add(n(cur.element(i.add(N))))
          .sub(c.mul(4))
        target.assign(
          c
            .mul(2)
            .sub(target.mul(1 - damp))
            .add(lap.mul(r2))
            .div(1 + damp),
        )
      })
    }),
    Fn(() => {
      If(instanceIndex.greaterThanEqual(SOURCES), () => {
        Return()
      })
      const cell = int(n(sources.element(instanceIndex.mul(3)))).toVar()
      const phase = n(sources.element(instanceIndex.mul(3).add(1)))
      const weight = n(sources.element(instanceIndex.mul(3).add(2)))
      const target = n(prev.element(cell))
      target.addAssign(
        cos(u.w.sub(phase))
          .mul(weight)
          .mul(SOURCE * SIM_DT * SIM_DT),
      )
    })().compute(SOURCES, [64]),
    perCell((i) => {
      const v = n(prev.element(i))
      const p = n(power.element(i))
      p.addAssign(v.mul(v).sub(p).mul(keep))
    }),
  ]
  const steps = [step(a, b), step(b, a)]

  const cellAt = (x: AnyNode, y: AnyNode) =>
    int(clamp(y.add(WALL).div(dx), 0, N - 1))
      .mul(N)
      .add(int(clamp(x.add(WALL).div(dx), 0, N - 1)))
  const resetPeak = Fn(() => {
    atomicStore(peak.element(0), uint(0))
    atomicStore(peak.element(1), uint(0))
  })().compute(1, [1])
  const ringPeak = Fn(() => {
    If(instanceIndex.greaterThanEqual(RING_SAMPLES), () => {
      Return()
    })
    const angle = float(instanceIndex).mul((2 * Math.PI) / RING_SAMPLES)
    const amp = sqrt(
      n(power.element(cellAt(angle.sin().mul(spec.ring), angle.cos().mul(spec.ring)))).mul(2),
    )
    atomicMax(peak.element(0), floatBitsToUint(amp))
  })().compute(RING_SAMPLES, [64])
  // The field's peak (spreading discounted), as in displayPeak.
  const fieldPeak = perCell((i) => {
    const px = float(i.mod(N)).add(0.5).mul(dx).sub(WALL)
    const py = float(i.div(N)).add(0.5).mul(dx).sub(WALL)
    const r = px.mul(px).add(py.mul(py)).sqrt()
    If(r.greaterThan(EMITTER_RING + 3).and(r.lessThan(FIELD_RADIUS)), () => {
      const spread = clamp(r.sub(EMITTER_RING).div(spec.ring - EMITTER_RING), 0.02, 1).sqrt()
      const amp = sqrt(n(power.element(i)).mul(2)).mul(spread)
      atomicMax(peak.element(1), floatBitsToUint(amp))
    })
  })

  /** Crests as in `writeCrests`, into the storage texture. */
  const publish = (cur: typeof a) =>
    perCell((i) => {
      const x = i.mod(N)
      const y = i.div(N)
      const px = float(x).add(0.5).mul(dx).sub(WALL)
      const py = float(y).add(0.5).mul(dx).sub(WALL)
      const r = px.mul(px).add(py.mul(py)).sqrt()
      const fade = clamp(float(FIELD_RADIUS).sub(r).div(4), 0, 1).mul(
        clamp(r.sub(EMITTER_RING + 3).div(5), 0, 1),
      )
      const amp = sqrt(n(power.element(i)).mul(2)).add(1e-9)
      const v = n(cur.element(i)).div(amp)
      const crest = min(1, max(v, 0).mul(max(v, 0)))
      const ringTop = n(uintBitsToFloat(atomicLoad(peak.element(0))))
      const fieldTop = n(uintBitsToFloat(atomicLoad(peak.element(1))))
      const top = max(max(ringTop, fieldTop.mul(FIELD_SHARE)), 1e-9)
      const spread = clamp(r.sub(EMITTER_RING).div(spec.ring - EMITTER_RING), 0.02, 1).sqrt()
      const rel = min(1, amp.div(top).mul(spread))
      const value = crest.mul(rel.mul(rel).mul(0.82).add(0.18)).mul(fade)
      textureStore(texture, ivec2(x, y), vec4(value, value, value, 1)).toWriteOnly()
    })
  // After an even number of steps the newest field is in `a`, after an odd one in `b`.
  const publishFrom = [publish(a), publish(b)]

  let parity = 0
  let time = 0
  return {
    texture,
    advance(renderer, focus, touch, count) {
      const gl = renderer as WebGPURenderer
      aimWaves(geometry, focus)
      setTouch(geometry, touch)
      // The touch fades as in stepWave, once per call instead of per step.
      const fade = 1 - Math.exp((-count * SIM_DT) / TOUCH_FADE)
      geometry.touch += (geometry.touchTarget - geometry.touch) * fade
      const data = sources.value.array as Float32Array
      for (let e = 0; e < EMITTERS; e++) {
        data[e * 3] = geometry.sourceCell[e]
        data[e * 3 + 1] = geometry.sourcePhase[e]
        data[e * 3 + 2] = 1
      }
      data[EMITTERS * 3] = Math.max(0, geometry.touchCell)
      data[EMITTERS * 3 + 1] = 0
      data[EMITTERS * 3 + 2] = geometry.touchCell >= 0 ? geometry.touch * TOUCH_STRENGTH : 0
      sources.value.needsUpdate = true
      for (let s = 0; s < count; s++) {
        time += SIM_DT
        u.w.value = 2 * Math.PI * FREQUENCY * time
        gl.compute(steps[parity])
        parity ^= 1
      }
      gl.compute([resetPeak, ringPeak, fieldPeak, publishFrom[parity]])
    },
    dispose() {
      texture.dispose()
      for (const k of [...steps.flat(), resetPeak, ringPeak, fieldPeak, ...publishFrom]) k.dispose()
    },
  }
}
