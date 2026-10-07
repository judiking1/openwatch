import { useEffect, useState } from 'react'
import { Color, ShaderMaterial, type Material } from 'three'
import { StableFluid, type FluidSolver } from '../../three/fluid/StableFluid'

/** Per-frame inputs of the water display. */
export type WaterFrame = {
  level: number
  time: number
  impactAge: number
  deep: string
  shallow: string
}

/** A fluid solver plus the material that displays it, for one renderer family. */
export interface WaterSim {
  readonly solver: FluidSolver
  readonly material: Material
  update(frame: WaterFrame): void
  dispose(): void
}

export const FLUID_OPTIONS = {
  width: 64,
  height: 200,
  pressureIterations: 20,
  dyeDissipation: 0.975,
}

const WATER_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

/** Shades the simulated water below a moving free surface. */
const WATER_FRAGMENT = /* glsl */ `
uniform sampler2D dye;
uniform sampler2D velocity;
uniform float level;
uniform float time;
uniform float impactAge;
uniform vec3 deep;
uniform vec3 shallow;
varying vec2 vUv;
void main() {
  float ripple = 0.004 * sin(vUv.x * 38.0 + time * 2.6)
    + 0.006 * exp(-impactAge * 5.0) * cos(30.0 * abs(vUv.x - 0.55) - impactAge * 18.0)
      * exp(-abs(vUv.x - 0.55) * 4.0);
  float surface = level + ripple;
  if (vUv.y > surface) discard;
  float depth = clamp(vUv.y / max(level, 0.001), 0.0, 1.0);
  vec3 color = mix(deep, shallow, pow(depth, 1.6));
  vec3 d = texture2D(dye, vUv).rgb;
  float speed = length(texture2D(velocity, vUv).xy);
  color += d * 0.6 + vec3(0.06) * smoothstep(5.0, 60.0, speed);
  float meniscus = smoothstep(0.012, 0.0, surface - vUv.y);
  color = mix(color, vec3(0.85, 0.95, 1.0), meniscus * 0.7);
  gl_FragColor = vec4(color, 0.82 + 0.15 * meniscus);
}`

/** WebGLRenderer: GLSL solver and a GLSL ShaderMaterial. */
export function createGlslWater(): WaterSim {
  const solver = new StableFluid(FLUID_OPTIONS)
  const material = new ShaderMaterial({
    vertexShader: WATER_VERTEX,
    fragmentShader: WATER_FRAGMENT,
    transparent: true,
    uniforms: {
      dye: { value: null },
      velocity: { value: null },
      level: { value: 0 },
      time: { value: 0 },
      impactAge: { value: 10 },
      deep: { value: new Color() },
      shallow: { value: new Color() },
    },
  })
  return {
    solver,
    material,
    update(frame) {
      const u = material.uniforms
      u.dye.value = solver.dyeTexture
      u.velocity.value = solver.velocityTexture
      u.level.value = frame.level
      u.time.value = frame.time
      u.impactAge.value = frame.impactAge
      u.deep.value.set(frame.deep)
      u.shallow.value.set(frame.shallow)
      // GLB export cannot carry the shader; it falls back to this colour.
      material.userData.exportColor = frame.shallow
    },
    dispose() {
      solver.dispose()
      material.dispose()
    },
  }
}

/**
 * The water for the current renderer: GLSL on WebGLRenderer, TSL (loaded on demand with
 * `three/webgpu`) on the node-based WebGPURenderer, where GLSL materials cannot run — with
 * compute shaders when it has the WebGPU backend.
 */
export function useWaterSim({
  nodes,
  compute,
}: {
  nodes: boolean
  compute: boolean
}): WaterSim | null {
  const [sim, setSim] = useState<WaterSim | null>(null)
  useEffect(() => {
    let live = true
    let made: WaterSim | undefined
    const load = nodes
      ? import('./waterTSL').then((m) => m.createTslWater(compute))
      : Promise.resolve(createGlslWater())
    void load.then((s) => {
      if (live) {
        made = s
        setSim(s)
      } else s.dispose()
    })
    return () => {
      live = false
      made?.dispose()
    }
  }, [nodes, compute])
  return sim
}
