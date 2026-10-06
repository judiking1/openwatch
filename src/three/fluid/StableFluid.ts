import {
  Camera,
  GLSL3,
  HalfFloatType,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type IUniform,
  type Texture,
  type WebGLRenderer,
} from 'three'

/**
 * 2D incompressible Navier–Stokes on the GPU — Jos Stam, "Stable Fluids" (SIGGRAPH 1999).
 *
 *   ∂u/∂t = −(u·∇)u − ∇p + f,   ∇·u = 0
 *
 * Each step: advect velocity and dye semi-Lagrangianly (unconditionally stable), compute
 * the divergence of the provisional velocity, solve the Poisson equation ∇²p = ∇·u with
 * Jacobi iterations, then subtract ∇p so the field is divergence-free again.
 *
 * Fields live in half-float ping-pong render targets; every pass is one full-screen
 * triangle pair. Velocities are in grid cells per second. A `liquidHeight` uniform turns
 * everything above the free surface into air (no velocity), so the solver doubles as a
 * simple open-top tank.
 */

const VERTEX = /* glsl */ `
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`

const HEADER = /* glsl */ `
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 texel;`

const ADVECT = /* glsl */ `${HEADER}
uniform sampler2D velocity;
uniform sampler2D source;
uniform float dt;
uniform float dissipation;
void main() {
  vec2 back = vUv - dt * texture(velocity, vUv).xy * texel;
  outColor = dissipation * texture(source, back);
}`

const SPLAT = /* glsl */ `${HEADER}
uniform sampler2D target;
uniform vec2 point;
uniform vec3 value;
uniform float radius;
uniform float aspect;
void main() {
  vec2 d = vUv - point;
  d.x *= aspect;
  vec3 base = texture(target, vUv).xyz;
  outColor = vec4(base + value * exp(-dot(d, d) / radius), 1.0);
}`

/** Velocity is zero at the walls and above the free surface. */
const BOUNDARY = /* glsl */ `${HEADER}
uniform sampler2D velocity;
uniform float liquidHeight;
void main() {
  vec2 v = texture(velocity, vUv).xy;
  float wall = step(texel.x, vUv.x) * step(vUv.x, 1.0 - texel.x) * step(texel.y, vUv.y);
  float liquid = step(vUv.y, liquidHeight);
  outColor = vec4(v * wall * liquid, 0.0, 1.0);
}`

const DIVERGENCE = /* glsl */ `${HEADER}
uniform sampler2D velocity;
void main() {
  float l = texture(velocity, vUv - vec2(texel.x, 0.0)).x;
  float r = texture(velocity, vUv + vec2(texel.x, 0.0)).x;
  float b = texture(velocity, vUv - vec2(0.0, texel.y)).y;
  float t = texture(velocity, vUv + vec2(0.0, texel.y)).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`

const JACOBI = /* glsl */ `${HEADER}
uniform sampler2D pressure;
uniform sampler2D divergence;
void main() {
  float l = texture(pressure, vUv - vec2(texel.x, 0.0)).x;
  float r = texture(pressure, vUv + vec2(texel.x, 0.0)).x;
  float b = texture(pressure, vUv - vec2(0.0, texel.y)).x;
  float t = texture(pressure, vUv + vec2(0.0, texel.y)).x;
  float div = texture(divergence, vUv).x;
  outColor = vec4(0.25 * (l + r + b + t - div), 0.0, 0.0, 1.0);
}`

const GRADIENT = /* glsl */ `${HEADER}
uniform sampler2D pressure;
uniform sampler2D velocity;
void main() {
  float l = texture(pressure, vUv - vec2(texel.x, 0.0)).x;
  float r = texture(pressure, vUv + vec2(texel.x, 0.0)).x;
  float b = texture(pressure, vUv - vec2(0.0, texel.y)).x;
  float t = texture(pressure, vUv + vec2(0.0, texel.y)).x;
  vec2 v = texture(velocity, vUv).xy - 0.5 * vec2(r - l, t - b);
  outColor = vec4(v, 0.0, 1.0);
}`

const SCALE = /* glsl */ `${HEADER}
uniform sampler2D target;
uniform float factor;
void main() { outColor = factor * texture(target, vUv); }`

class PingPong {
  read: WebGLRenderTarget
  write: WebGLRenderTarget
  constructor(width: number, height: number) {
    const make = () =>
      new WebGLRenderTarget(width, height, {
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

export type StableFluidOptions = {
  width: number
  height: number
  /** Jacobi iterations for the pressure solve (more = less compressible). */
  pressureIterations?: number
  velocityDissipation?: number
  dyeDissipation?: number
}

export class StableFluid {
  readonly width: number
  readonly height: number
  private velocity: PingPong
  private dye: PingPong
  private pressure: PingPong
  private divergence: WebGLRenderTarget
  private scene = new Scene()
  private camera = new Camera()
  private quad: Mesh
  private programs: Record<string, RawShaderMaterial>
  private iterations: number
  private velocityDissipation: number
  private dyeDissipation: number

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

    const texel = new Vector2(1 / width, 1 / height)
    const program = (fragmentShader: string, uniforms: Record<string, IUniform>) =>
      new RawShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader,
        uniforms: { texel: { value: texel }, ...uniforms },
        depthTest: false,
        depthWrite: false,
        glslVersion: GLSL3,
      })
    this.programs = {
      advect: program(ADVECT, {
        velocity: { value: null },
        source: { value: null },
        dt: { value: 0 },
        dissipation: { value: 1 },
      }),
      splat: program(SPLAT, {
        target: { value: null },
        point: { value: new Vector2() },
        value: { value: new Vector3() },
        radius: { value: 0.001 },
        aspect: { value: width / height },
      }),
      boundary: program(BOUNDARY, { velocity: { value: null }, liquidHeight: { value: 1 } }),
      divergence: program(DIVERGENCE, { velocity: { value: null } }),
      jacobi: program(JACOBI, { pressure: { value: null }, divergence: { value: null } }),
      gradient: program(GRADIENT, { pressure: { value: null }, velocity: { value: null } }),
      scale: program(SCALE, { target: { value: null }, factor: { value: 1 } }),
    }
    this.quad = new Mesh(new PlaneGeometry(2, 2))
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
  }

  /** The dye field (RGB), to be sampled by a display material. */
  get dyeTexture(): Texture {
    return this.dye.read.texture
  }

  get velocityTexture(): Texture {
    return this.velocity.read.texture
  }

  private run(
    gl: WebGLRenderer,
    name: string,
    uniforms: Record<string, unknown>,
    target: WebGLRenderTarget,
  ) {
    const material = this.programs[name]
    for (const [key, value] of Object.entries(uniforms)) material.uniforms[key].value = value
    this.quad.material = material
    gl.setRenderTarget(target)
    gl.render(this.scene, this.camera)
  }

  /**
   * Adds a Gaussian impulse of velocity (cells/s) and dye at uv `(x, y)`.
   * Batched splats are applied at the start of the next `step`.
   */
  private pending: Array<{ x: number; y: number; force: Vector2; color: Vector3; radius: number }> =
    []

  splat(x: number, y: number, force: Vector2, color: Vector3, radius = 0.0015) {
    this.pending.push({ x, y, force, color, radius })
  }

  /** Advances the simulation by `dt` seconds with the free surface at `liquidHeight` (0..1). */
  step(gl: WebGLRenderer, dt: number, liquidHeight: number) {
    const previous = gl.getRenderTarget()
    const autoClear = gl.autoClear
    gl.autoClear = false

    for (const s of this.pending) {
      const point = new Vector2(s.x, s.y)
      this.run(
        gl,
        'splat',
        {
          target: this.velocity.read.texture,
          point,
          value: new Vector3(s.force.x, s.force.y, 0),
          radius: s.radius,
        },
        this.velocity.write,
      )
      this.velocity.swap()
      this.run(
        gl,
        'splat',
        { target: this.dye.read.texture, point, value: s.color, radius: s.radius },
        this.dye.write,
      )
      this.dye.swap()
    }
    this.pending = []

    const v = this.velocity
    this.run(
      gl,
      'advect',
      {
        velocity: v.read.texture,
        source: v.read.texture,
        dt,
        dissipation: this.velocityDissipation,
      },
      v.write,
    )
    v.swap()
    this.run(gl, 'boundary', { velocity: v.read.texture, liquidHeight }, v.write)
    v.swap()

    this.run(gl, 'divergence', { velocity: v.read.texture }, this.divergence)
    // Warm start from a damped previous pressure: converges in fewer iterations.
    this.run(gl, 'scale', { target: this.pressure.read.texture, factor: 0.8 }, this.pressure.write)
    this.pressure.swap()
    for (let i = 0; i < this.iterations; i++) {
      this.run(
        gl,
        'jacobi',
        { pressure: this.pressure.read.texture, divergence: this.divergence.texture },
        this.pressure.write,
      )
      this.pressure.swap()
    }
    this.run(
      gl,
      'gradient',
      { pressure: this.pressure.read.texture, velocity: v.read.texture },
      v.write,
    )
    v.swap()
    this.run(gl, 'boundary', { velocity: v.read.texture, liquidHeight }, v.write)
    v.swap()

    this.run(
      gl,
      'advect',
      {
        velocity: v.read.texture,
        source: this.dye.read.texture,
        dt,
        dissipation: this.dyeDissipation,
      },
      this.dye.write,
    )
    this.dye.swap()

    gl.setRenderTarget(previous)
    gl.autoClear = autoClear
  }

  dispose() {
    this.velocity.dispose()
    this.dye.dispose()
    this.pressure.dispose()
    this.divergence.dispose()
    this.quad.geometry.dispose()
    Object.values(this.programs).forEach((p) => p.dispose())
  }
}
