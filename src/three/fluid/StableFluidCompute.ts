import {
  HalfFloatType,
  LinearFilter,
  StorageTexture,
  Vector2,
  Vector3,
  type ComputeNode,
  type Texture,
  type WebGPURenderer,
} from 'three/webgpu'
import {
  clamp,
  exp,
  float,
  floor,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  int,
  ivec2,
  mix,
  Return,
  textureStore,
  uniform,
  vec2,
  vec4,
} from 'three/tsl'
import type { FluidSolver, StableFluidOptions } from './StableFluid'
import { loose as n } from '../utils/tsl'

/**
 * Stam's Stable Fluids as WebGPU compute shaders (TSL `Fn().compute()`), used when
 * `WebGPURenderer` runs on its WebGPU backend.
 *
 * Same passes and units as `StableFluid` / `StableFluidTSL`, but the fields are storage
 * buffers with one thread per cell instead of half-float render targets drawn with
 * full-screen quads: no rasteriser, no ping-pong where a pass only touches its own cell
 * (splat, boundary, scale, gradient), and the whole step is two compute submissions.
 * A last kernel writes dye and velocity into storage textures, so the display material
 * samples them exactly like the render-target versions.
 */

const WORKGROUP = 64

export class StableFluidCompute implements FluidSolver {
  readonly width: number
  readonly height: number
  private readonly count: number
  private readonly iterations: number
  private readonly dyeOut: StorageTexture
  private readonly velocityOut: StorageTexture
  private pending: Array<{ x: number; y: number; force: Vector2; color: Vector3; radius: number }> =
    []

  private u = {
    dt: uniform(0),
    liquidHeight: uniform(1),
    point: uniform(new Vector2()),
    value: uniform(new Vector3()),
    radius: uniform(0.001),
    velocityDissipation: uniform(0.995),
    dyeDissipation: uniform(0.992),
  }

  private kernels: {
    splatVelocity: ComputeNode
    splatDye: ComputeNode
    /** Velocity: advect, walls, divergence, warm start, Jacobi, gradient, walls. */
    project: ComputeNode[]
    /** Dye: advect, then copy back and publish both fields to the storage textures. */
    publish: ComputeNode[]
  }

  constructor(options: StableFluidOptions) {
    const W = options.width
    const H = options.height
    this.width = W
    this.height = H
    this.count = W * H
    this.iterations = options.pressureIterations ?? 24
    // Even, so the pressure ends in the buffer it started from.
    if (this.iterations % 2) this.iterations += 1
    this.u.velocityDissipation.value = options.velocityDissipation ?? 0.995
    this.u.dyeDissipation.value = options.dyeDissipation ?? 0.992

    const makeTexture = () => {
      const t = new StorageTexture(W, H)
      t.type = HalfFloatType
      t.minFilter = t.magFilter = LinearFilter
      return t
    }
    this.dyeOut = makeTexture()
    this.velocityOut = makeTexture()

    const velA = instancedArray(this.count, 'vec2')
    const velB = instancedArray(this.count, 'vec2')
    const dyeA = instancedArray(this.count, 'vec4')
    const dyeB = instancedArray(this.count, 'vec4')
    const pA = instancedArray(this.count, 'float')
    const pB = instancedArray(this.count, 'float')
    const div = instancedArray(this.count, 'float')
    const u = this.u

    type Buffer = typeof velA | typeof dyeA | typeof pA
    const cell = () => {
      const i = int(instanceIndex)
      return { i, x: i.mod(W), y: i.div(W) }
    }
    const at = (buffer: Buffer, x: unknown, y: unknown) => {
      const cx = clamp(n(x), 0, W - 1)
      const cy = clamp(n(y), 0, H - 1)
      return n(buffer.element(n(cy).mul(W).add(cx)))
    }
    /** Bilinear read at a continuous cell position (cell centres on integers), edge-clamped. */
    const sample = (buffer: Buffer, px: unknown, py: unknown) => {
      const x0 = int(floor(n(px)))
      const y0 = int(floor(n(py)))
      const fx = n(px).sub(floor(n(px)))
      const fy = n(py).sub(floor(n(py)))
      const bottom = mix(at(buffer, x0, y0), at(buffer, x0.add(1), y0), fx)
      const top = mix(at(buffer, x0, y0.add(1)), at(buffer, x0.add(1), y0.add(1)), fx)
      return n(mix(bottom, top, fy))
    }
    const kernel = (body: (c: ReturnType<typeof cell>) => void) =>
      Fn(() => {
        If(instanceIndex.greaterThanEqual(this.count), () => {
          Return()
        })
        body(cell())
      })().compute(this.count, [WORKGROUP])

    const splat = (buffer: Buffer, value: unknown) =>
      kernel(({ i, x, y }) => {
        const d = vec2(
          float(x)
            .add(0.5)
            .div(W)
            .sub(u.point.x)
            .mul(W / H),
          float(y).add(0.5).div(H).sub(u.point.y),
        )
        const amount = exp(d.dot(d).negate().div(u.radius))
        const target = n(buffer.element(i))
        target.assign(target.add(n(value).mul(amount)))
      })

    const advect = (velocity: Buffer, source: Buffer, target: Buffer, dissipation: unknown) =>
      kernel(({ i, x, y }) => {
        const v = n(velocity.element(i))
        const px = float(x).sub(v.x.mul(u.dt))
        const py = float(y).sub(v.y.mul(u.dt))
        n(target.element(i)).assign(sample(source, px, py).mul(n(dissipation)))
      })

    // Velocity is zero at the side and bottom walls and above the free surface.
    const boundary = (velocity: Buffer) =>
      kernel(({ i, x, y }) => {
        const inside = x
          .greaterThanEqual(1)
          .and(x.lessThanEqual(W - 2))
          .and(y.greaterThanEqual(1))
          .and(float(y).add(0.5).div(H).lessThanEqual(u.liquidHeight))
        If(inside.not(), () => {
          n(velocity.element(i)).assign(vec2(0, 0))
        })
      })

    const divergence = kernel(({ i, x, y }) => {
      const l = at(velB, x.sub(1), y).x
      const r = at(velB, x.add(1), y).x
      const b = at(velB, x, y.sub(1)).y
      const t = at(velB, x, y.add(1)).y
      n(div.element(i)).assign(r.sub(l).add(t).sub(b).mul(0.5))
    })

    // Warm start from a damped previous pressure: converges in fewer iterations.
    const warmStart = kernel(({ i }) => {
      const p = n(pA.element(i))
      p.assign(p.mul(0.8))
    })

    const jacobi = (from: Buffer, to: Buffer) =>
      kernel(({ i, x, y }) => {
        const sum = at(from, x.sub(1), y)
          .add(at(from, x.add(1), y))
          .add(at(from, x, y.sub(1)))
          .add(at(from, x, y.add(1)))
        n(to.element(i)).assign(sum.sub(n(div.element(i))).mul(0.25))
      })
    const jacobiAB = jacobi(pA, pB)
    const jacobiBA = jacobi(pB, pA)

    const gradient = kernel(({ i, x, y }) => {
      const l = at(pA, x.sub(1), y)
      const r = at(pA, x.add(1), y)
      const b = at(pA, x, y.sub(1))
      const t = at(pA, x, y.add(1))
      const v = n(velB.element(i))
      n(velA.element(i)).assign(v.sub(vec2(r.sub(l), t.sub(b)).mul(0.5)))
    })

    const publishFields = kernel(({ i, x, y }) => {
      const dye = n(dyeB.element(i))
      n(dyeA.element(i)).assign(dye)
      const at2 = ivec2(x, y)
      textureStore(this.dyeOut, at2, vec4(dye.xyz, 1)).toWriteOnly()
      textureStore(this.velocityOut, at2, vec4(n(velA.element(i)), 0, 1)).toWriteOnly()
    })

    const pressure: ComputeNode[] = []
    for (let k = 0; k < this.iterations; k += 2) pressure.push(jacobiAB, jacobiBA)

    this.kernels = {
      splatVelocity: splat(velA, vec2(u.value.x, u.value.y)),
      splatDye: splat(dyeA, vec4(u.value, 0)),
      project: [
        advect(velA, velA, velB, u.velocityDissipation),
        boundary(velB),
        divergence,
        warmStart,
        ...pressure,
        gradient,
        boundary(velA),
      ],
      publish: [advect(velA, dyeA, dyeB, u.dyeDissipation), publishFields],
    }
  }

  get dyeTexture(): Texture {
    return this.dyeOut
  }

  get velocityTexture(): Texture {
    return this.velocityOut
  }

  splat(x: number, y: number, force: Vector2, color: Vector3, radius = 0.0015) {
    this.pending.push({ x, y, force, color, radius })
  }

  step(renderer: unknown, dt: number, liquidHeight: number) {
    const gl = renderer as WebGPURenderer
    const { u, kernels } = this
    // Uniforms are uploaded per compute() call, so each splat is its own dispatch.
    for (const s of this.pending) {
      u.point.value.set(s.x, s.y)
      u.radius.value = s.radius
      u.value.value.set(s.force.x, s.force.y, 0)
      gl.compute(kernels.splatVelocity)
      u.value.value.copy(s.color)
      gl.compute(kernels.splatDye)
    }
    this.pending = []
    u.dt.value = dt
    u.liquidHeight.value = liquidHeight
    gl.compute(kernels.project)
    gl.compute(kernels.publish)
  }

  dispose() {
    this.dyeOut.dispose()
    this.velocityOut.dispose()
    const all = [
      this.kernels.splatVelocity,
      this.kernels.splatDye,
      ...this.kernels.project,
      ...this.kernels.publish,
    ]
    new Set(all).forEach((k) => k.dispose())
  }
}
