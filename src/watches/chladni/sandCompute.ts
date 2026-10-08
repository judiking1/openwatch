import {
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Vector2,
  type ComputeNode,
  type WebGPURenderer,
} from 'three/webgpu'
import {
  float,
  Fn,
  hash,
  If,
  instancedArray,
  instanceIndex,
  max,
  min,
  positionLocal,
  Return,
  sqrt,
  storage,
  uniform,
  vec2,
  vec3,
} from 'three/tsl'
import { DRIFT, GAIN, KICK, PLATE_RADIUS, SLIDE, SOFT, type PlatePose } from './sand'

// TSL typings do not follow storage elements through swizzles; the graph is checked at build.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyNode = any
const n = (node: unknown): AnyNode => node

/**
 * Chladni sand on the WebGPU backend: grains live in a storage buffer, a compute kernel
 * advances them with exactly the CPU model of `sand.ts` (energy slope, kicks, tilt slide,
 * reflection at the rim), and the instanced grains read their positions from the same buffer
 * in the vertex shader — no copies back to the CPU.
 */
export function createComputeSand(initial: Float32Array, z: number, grainSize: number) {
  const count = initial.length / 2
  const grains = instancedArray(initial, 'vec2')
  const u = {
    dir: uniform(new Vector2(0, 1)),
    ring: uniform(40),
    dt: uniform(1 / 60),
    kick: uniform(0),
    tilt: uniform(new Vector2(0, 0)),
    seed: uniform(0),
  }

  const step: ComputeNode = Fn(() => {
    If(instanceIndex.greaterThanEqual(count), () => {
      Return()
    })
    const grain = n(grains.element(instanceIndex))
    const p = vec2(grain.x, grain.y).toVar()
    const d = n(u.dir)
    const r = max(p.length(), 1e-6)
    const s = n(p.x.mul(d.y).sub(p.y.mul(d.x)).div(PLATE_RADIUS))
    const dd = n(r.sub(u.ring).div(PLATE_RADIUS))
    const A = n(s.mul(s))
    const B = n(dd.mul(dd))
    const sum = n(A.add(B).add(SOFT))
    const q = n(sum.mul(sum))
    const dEds = n(float(GAIN).mul(B).mul(B.add(SOFT)).mul(s).mul(2).div(q))
    const dEdd = n(float(GAIN).mul(A).mul(A.add(SOFT)).mul(dd).mul(2).div(q))
    const grad = vec2(
      dEds.mul(d.y).add(dEdd.mul(p.x).div(r)),
      dEds.mul(d.x).negate().add(dEdd.mul(p.y).div(r)),
    ).div(PLATE_RADIUS)
    const shake = sqrt(float(GAIN).mul(A).mul(B).div(sum))
    const seed = float(instanceIndex).mul(1.618).add(u.seed)
    const jitter = vec2(hash(seed), hash(seed.add(0.5))).sub(0.5)
    const slide = float(SLIDE)
      .mul(min(1, shake.mul(4)))
      .mul(u.dt)
    p.addAssign(
      grad.mul(-DRIFT).mul(u.dt).add(jitter.mul(u.kick).mul(shake)).add(n(u.tilt).mul(slide)),
    )
    const out = p.length()
    If(out.greaterThan(PLATE_RADIUS), () => {
      p.mulAssign(
        float(2 * PLATE_RADIUS)
          .sub(out)
          .div(out),
      )
    })
    grain.assign(p)
  })().compute(count, [64])

  const material = new MeshStandardNodeMaterial({ roughness: 0.9 })
  // Vertex shaders may only read storage buffers: a read-only view of the same buffer.
  const view = storage(grains.value, 'vec2', count).toReadOnly()
  const grain = n(view.element(instanceIndex))
  material.positionNode = positionLocal.add(vec3(grain.x, grain.y, z))
  const mesh = new InstancedMesh(new IcosahedronGeometry(grainSize, 0), material, count)
  mesh.frustumCulled = false
  mesh.name = 'sand'

  let frame = 0
  return {
    mesh,
    /** The grain buffer (positions as xy pairs), for readback in tests. */
    buffer: grains,
    /** Advances the sand by `dt` seconds (call twice per frame for two substeps). */
    step(renderer: unknown, pose: PlatePose, dt: number, tilt: { x: number; y: number }) {
      const a = (pose.hour * Math.PI) / 180
      u.dir.value.set(Math.sin(a), Math.cos(a))
      u.ring.value = pose.ring
      u.dt.value = dt
      u.kick.value = KICK * Math.sqrt(dt) * (1 + 2.5 * Math.exp(-pose.pulse * 10))
      u.tilt.value.set(tilt.x, tilt.y)
      u.seed.value = (frame++ % 9973) * 0.731
      ;(renderer as WebGPURenderer).compute(step)
    },
    dispose() {
      step.dispose()
      mesh.geometry.dispose()
      material.dispose()
    },
  }
}
