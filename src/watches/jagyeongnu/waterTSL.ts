import { Color, MeshBasicNodeMaterial } from 'three/webgpu'
import {
  abs,
  clamp,
  cos,
  Discard,
  exp,
  float,
  Fn,
  length,
  max,
  mix,
  pow,
  sin,
  smoothstep,
  sRGBTransferEOTF,
  texture,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl'
import { StableFluidTSL } from '../../three/fluid/StableFluidTSL'
import { FLUID_OPTIONS, type WaterSim } from './water'

/** WebGPURenderer: the TSL solver and the GLSL water shader rewritten as a node material. */
export function createTslWater(): WaterSim {
  const solver = new StableFluidTSL(FLUID_OPTIONS)
  const level = uniform(0)
  const time = uniform(0)
  const impactAge = uniform(10)
  const deep = uniform(new Color())
  const shallow = uniform(new Color())
  const dye = texture(solver.dyeTexture)
  const velocity = texture(solver.velocityTexture)

  // The GLSL ShaderMaterial writes its colour straight to the framebuffer (no tone mapping,
  // no sRGB encoding). Match that look: skip tone mapping and pre-decode what the output
  // transform will encode.
  const material = new MeshBasicNodeMaterial({ transparent: true, toneMapped: false })
  material.colorNode = Fn(() => {
    const p = uv()
    const off = abs(p.x.sub(0.55))
    const ripple = sin(p.x.mul(38).add(time.mul(2.6)))
      .mul(0.004)
      .add(
        exp(impactAge.mul(-5))
          .mul(cos(off.mul(30).sub(impactAge.mul(18))))
          .mul(exp(off.mul(-4)))
          .mul(0.006),
      )
    const surface = level.add(ripple)
    Discard(p.y.greaterThan(surface))
    const depth = clamp(p.y.div(max(level, 0.001)), 0, 1)
    const base = mix(deep, shallow, pow(depth, float(1.6)))
    const stirred = base
      .add(dye.rgb.mul(0.6))
      .add(vec3(0.06).mul(smoothstep(5, 60, length(velocity.xy))))
    const meniscus = smoothstep(0.012, 0, surface.sub(p.y))
    const color = mix(stirred, vec3(0.85, 0.95, 1), meniscus.mul(0.7))
    return vec4(sRGBTransferEOTF(color) as typeof color, meniscus.mul(0.15).add(0.82))
  })()

  return {
    solver,
    material,
    update(frame) {
      dye.value = solver.dyeTexture
      velocity.value = solver.velocityTexture
      level.value = frame.level
      time.value = frame.time
      impactAge.value = frame.impactAge
      deep.value.set(frame.deep)
      shallow.value.set(frame.shallow)
      // GLB export cannot carry the shader; it falls back to this colour.
      material.userData.exportColor = frame.shallow
    },
    dispose() {
      solver.dispose()
      material.dispose()
    },
  }
}
