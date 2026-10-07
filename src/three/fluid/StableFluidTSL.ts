import {
  HalfFloatType,
  LinearFilter,
  MeshBasicNodeMaterial,
  QuadMesh,
  RenderTarget,
  RGBAFormat,
  Vector2,
  Vector3,
  type Node,
  type Texture,
  type WebGPURenderer,
} from 'three/webgpu'
import { exp, float, step, texture, uniform, uv, vec2, vec4 } from 'three/tsl'
import type { FluidSolver, StableFluidOptions } from './StableFluid'

/**
 * Stam's Stable Fluids written in TSL. Same passes, uniforms and behaviour as the GLSL
 * `StableFluid`, but node-based: on `WebGPURenderer` it compiles to WGSL (WebGPU backend)
 * or GLSL (WebGL2 backend). Fields are half-float render targets drawn with full-screen
 * `QuadMesh` passes; texture nodes are re-pointed at the current ping-pong side per pass.
 */

type TextureNode = ReturnType<typeof texture>
type Sample = (slot: string, at?: Node<'vec2'>) => Node<'vec4'>

class PingPong {
  read: RenderTarget
  write: RenderTarget
  constructor(width: number, height: number) {
    const make = () =>
      new RenderTarget(width, height, {
        type: HalfFloatType,
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
      })
    this.read = make()
    this.write = make()
  }
  swap() {
    ;[this.read, this.write] = [this.write, this.read]
  }
  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}

/** A full-screen pass whose texture inputs can be re-bound before each draw. */
class Pass {
  readonly quad: QuadMesh
  private slots: Record<string, TextureNode[]> = {}
  private material = new MeshBasicNodeMaterial()
  constructor(build: (sample: Sample) => Node) {
    const placeholder = new RenderTarget(1, 1).texture
    this.material.fragmentNode = build((slot, at) => {
      const node = texture(placeholder, at ?? uv())
      ;(this.slots[slot] ??= []).push(node)
      return node as unknown as Node<'vec4'>
    })
    this.quad = new QuadMesh(this.material)
  }
  run(gl: WebGPURenderer, inputs: Record<string, Texture>, target: RenderTarget) {
    for (const [slot, value] of Object.entries(inputs)) {
      for (const node of this.slots[slot] ?? []) node.value = value
    }
    gl.setRenderTarget(target)
    this.quad.render(gl)
  }
  dispose() {
    this.material.dispose()
  }
}

export class StableFluidTSL implements FluidSolver {
  readonly width: number
  readonly height: number
  private velocity: PingPong
  private dye: PingPong
  private pressure: PingPong
  private divergence: RenderTarget
  private iterations: number
  private pending: Array<{ x: number; y: number; force: Vector2; color: Vector3; radius: number }> =
    []

  private u = {
    dt: uniform(0),
    dissipation: uniform(1),
    liquidHeight: uniform(1),
    point: uniform(new Vector2()),
    value: uniform(new Vector3()),
    radius: uniform(0.001),
    factor: uniform(1),
  }

  private passes: Record<string, Pass>

  constructor(options: StableFluidOptions) {
    const { width, height } = options
    this.width = width
    this.height = height
    this.iterations = options.pressureIterations ?? 24
    this.velocityDissipation = options.velocityDissipation ?? 0.995
    this.dyeDissipation = options.dyeDissipation ?? 0.992
    this.velocity = new PingPong(width, height)
    this.dye = new PingPong(width, height)
    this.pressure = new PingPong(width, height)
    this.divergence = this.pressure.read.clone()

    const texel = vec2(1 / width, 1 / height)
    const dx = vec2(1 / width, 0)
    const dy = vec2(0, 1 / height)
    const aspect = float(width / height)
    const u = this.u

    const p = uv()
    this.passes = {
      advect: new Pass((sample) => {
        const back = p.sub(sample('velocity').xy.mul(u.dt).mul(texel))
        return sample('source', back).mul(u.dissipation)
      }),
      splat: new Pass((sample) => {
        const d = vec2(p.x.sub(u.point.x).mul(aspect), p.y.sub(u.point.y))
        const base = sample('target').xyz
        return vec4(base.add(u.value.mul(exp(d.dot(d).negate().div(u.radius)))), 1)
      }),
      // Velocity is zero at the side and bottom walls and above the free surface.
      boundary: new Pass((sample) => {
        const wall = step(texel.x, p.x)
          .mul(step(p.x, float(1).sub(texel.x)))
          .mul(step(texel.y, p.y))
        const liquid = step(p.y, u.liquidHeight)
        return vec4(sample('velocity').xy.mul(wall).mul(liquid), 0, 1)
      }),
      divergence: new Pass((sample) => {
        const l = sample('velocity', p.sub(dx)).x
        const r = sample('velocity', p.add(dx)).x
        const b = sample('velocity', p.sub(dy)).y
        const t = sample('velocity', p.add(dy)).y
        return vec4(r.sub(l).add(t).sub(b).mul(0.5), 0, 0, 1)
      }),
      jacobi: new Pass((sample) => {
        const sum = sample('pressure', p.sub(dx))
          .x.add(sample('pressure', p.add(dx)).x)
          .add(sample('pressure', p.sub(dy)).x)
          .add(sample('pressure', p.add(dy)).x)
        return vec4(sum.sub(sample('divergence').x).mul(0.25), 0, 0, 1)
      }),
      gradient: new Pass((sample) => {
        const l = sample('pressure', p.sub(dx)).x
        const r = sample('pressure', p.add(dx)).x
        const b = sample('pressure', p.sub(dy)).x
        const t = sample('pressure', p.add(dy)).x
        const v = sample('velocity').xy.sub(vec2(r.sub(l), t.sub(b)).mul(0.5))
        return vec4(v, 0, 1)
      }),
      scale: new Pass((sample) => sample('target').mul(u.factor)),
    }
  }

  private velocityDissipation: number
  private dyeDissipation: number

  get dyeTexture(): Texture {
    return this.dye.read.texture
  }

  get velocityTexture(): Texture {
    return this.velocity.read.texture
  }

  splat(x: number, y: number, force: Vector2, color: Vector3, radius = 0.0015) {
    this.pending.push({ x, y, force, color, radius })
  }

  step(renderer: unknown, dt: number, liquidHeight: number) {
    const gl = renderer as WebGPURenderer
    const previous = gl.getRenderTarget()
    // Views (drei <View>) render with a scissor; the simulation must cover whole targets.
    const scissorTest = gl.getScissorTest()
    gl.setScissorTest(false)
    const { u, passes: p } = this
    u.liquidHeight.value = liquidHeight

    for (const s of this.pending) {
      u.point.value.set(s.x, s.y)
      u.radius.value = s.radius
      u.value.value.set(s.force.x, s.force.y, 0)
      p.splat.run(gl, { target: this.velocity.read.texture }, this.velocity.write)
      this.velocity.swap()
      u.value.value.copy(s.color)
      p.splat.run(gl, { target: this.dye.read.texture }, this.dye.write)
      this.dye.swap()
    }
    this.pending = []

    const v = this.velocity
    u.dt.value = dt
    u.dissipation.value = this.velocityDissipation
    p.advect.run(gl, { velocity: v.read.texture, source: v.read.texture }, v.write)
    v.swap()
    p.boundary.run(gl, { velocity: v.read.texture }, v.write)
    v.swap()

    p.divergence.run(gl, { velocity: v.read.texture }, this.divergence)
    u.factor.value = 0.8
    p.scale.run(gl, { target: this.pressure.read.texture }, this.pressure.write)
    this.pressure.swap()
    for (let i = 0; i < this.iterations; i++) {
      p.jacobi.run(
        gl,
        { pressure: this.pressure.read.texture, divergence: this.divergence.texture },
        this.pressure.write,
      )
      this.pressure.swap()
    }
    p.gradient.run(gl, { pressure: this.pressure.read.texture, velocity: v.read.texture }, v.write)
    v.swap()
    p.boundary.run(gl, { velocity: v.read.texture }, v.write)
    v.swap()

    u.dissipation.value = this.dyeDissipation
    p.advect.run(gl, { velocity: v.read.texture, source: this.dye.read.texture }, this.dye.write)
    this.dye.swap()

    gl.setRenderTarget(previous)
    gl.setScissorTest(scissorTest)
  }

  dispose() {
    this.velocity.dispose()
    this.dye.dispose()
    this.pressure.dispose()
    this.divergence.dispose()
    Object.values(this.passes).forEach((pass) => pass.dispose())
  }
}
