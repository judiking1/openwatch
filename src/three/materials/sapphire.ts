import { MeshPhysicalNodeMaterial, type MeshPhysicalMaterialParameters } from 'three/webgpu'
import {
  dot,
  float,
  materialOpacity,
  mix,
  normalView,
  positionViewDirection,
  pow,
  saturate,
} from 'three/tsl'

/**
 * Linear-light opacity that looks like the WebGL crystal over a dark dial. WebGPURenderer
 * blends in linear space (WebGL blends after sRGB encoding), where the same opacity reads
 * roughly 4× stronger.
 */
const LINEAR_OPACITY = 0.25

/**
 * Second TSL material: the sapphire crystal on WebGPURenderer. Instead of one flat opacity,
 * coverage follows Schlick's Fresnel term — nearly clear when looked through head-on,
 * mirror-like at grazing angles — so the dial stays readable while the edges catch light.
 * `opacity` (the customization value) still scales the head-on coverage.
 */
export function createSapphire(parameters: MeshPhysicalMaterialParameters) {
  const material = new MeshPhysicalNodeMaterial({
    metalness: 0,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true,
    depthWrite: false,
    ...parameters,
  })
  const facing = saturate(dot(normalView, positionViewDirection))
  const fresnel = pow(float(1).sub(facing), 5)
  material.opacityNode = mix(materialOpacity.mul(LINEAR_OPACITY), float(0.6), fresnel)
  return material
}
