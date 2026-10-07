import { MeshStandardNodeMaterial, type MeshStandardMaterialParameters } from 'three/webgpu'
import { clamp, materialColor, materialRoughness, mx_noise_float, uv, vec2 } from 'three/tsl'

/**
 * First TSL material: brushed metal for the case on WebGPURenderer.
 *
 * Grain runs along each part's u direction — around the case wall and the bezel, straight
 * across flat rings — as noise stretched ~12× more across the grain than along it. A coarse
 * octave gives the slow sheen variation, a fine one the individual scratches; both modulate
 * roughness more than colour, as real graining does. Colour and roughness still come from the
 * material's `color` / `roughness`, so the customization panel works unchanged.
 */
export function createBrushedMetal(parameters: MeshStandardMaterialParameters) {
  const material = new MeshStandardNodeMaterial({ metalness: 1, ...parameters })
  const p = uv()
  const coarse = mx_noise_float(vec2(p.x.mul(24), p.y.mul(300)))
  const fine = mx_noise_float(vec2(p.x.mul(60), p.y.mul(900)))
  const grain = coarse.mul(0.75).add(fine.mul(0.25))
  material.colorNode = materialColor.mul(grain.mul(0.06).add(1))
  material.roughnessNode = clamp(materialRoughness.add(grain.mul(0.14)), 0.03, 1)
  return material
}
