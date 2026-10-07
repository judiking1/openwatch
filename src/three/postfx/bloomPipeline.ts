import { RenderPipeline, type Camera, type Object3D, type WebGPURenderer } from 'three/webgpu'
import { pass, vec4 } from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import type { BloomSettings } from '../../types/watch'

/**
 * A node post-processing chain: the scene rendered into an HDR pass, plus a mip-chain bloom
 * of everything brighter than `threshold`, tone-mapped and encoded once at the end
 * (`RenderPipeline.outputColorTransform`). Because the threshold is applied before tone
 * mapping, only genuinely over-bright pixels — unlit `toneMapped: false` emitters such as
 * lasers — glow, not ordinary highlights.
 */
export function createBloomPipeline(
  renderer: unknown,
  scene: Object3D,
  camera: Camera,
  { strength, radius, threshold }: BloomSettings,
) {
  const scenePass = pass(scene, camera)
  const color = scenePass.getTextureNode('output')
  const glow = bloom(color, strength, radius, threshold)
  const pipeline = new RenderPipeline(renderer as WebGPURenderer)
  // Keep the scene's alpha: the stage canvas is transparent over the page background.
  pipeline.outputNode = vec4(color.rgb.add(glow.rgb), color.a)
  return {
    render: () => pipeline.render(),
    dispose: () => {
      glow.dispose()
      scenePass.dispose()
      pipeline.dispose()
    },
  }
}
