import { RenderPipeline, type Camera, type Object3D, type WebGPURenderer } from 'three/webgpu'
import { float, mrt, output, pass, vec4 } from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import type { BloomSettings } from '../../types/watch'

type Glowing = { userData: { glow?: boolean }; material?: unknown }
type MrtMaterial = { mrtNode?: unknown; needsUpdate?: boolean }

/**
 * Selective bloom as a node graph. The scene pass writes two targets (MRT): the colour and a
 * `glow` mask that is 0 everywhere except on meshes marked `userData.glow`. Only the masked
 * colour above `threshold` is bloomed and added back; tone mapping and encoding happen once
 * at the end (`RenderPipeline.outputColorTransform`).
 */
export function createBloomPipeline(
  renderer: unknown,
  scene: Object3D,
  camera: Camera,
  { strength, radius, threshold }: BloomSettings,
) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, glow: float(0) }))
  const color = scenePass.getTextureNode('output')
  const mask = scenePass.getTextureNode('glow')
  const glow = bloom(color.mul(mask.r), strength, radius, threshold)
  const pipeline = new RenderPipeline(renderer as WebGPURenderer)
  // Keep the scene's alpha: the stage canvas is transparent over the page background.
  pipeline.outputNode = vec4(color.rgb.add(glow.rgb), color.a)

  const glowOutput = mrt({ glow: float(1) })
  /** Marks emitters before they are first built (the model may mount after the pipeline). */
  const markEmitters = () =>
    scene.traverse((object) => {
      const o = object as unknown as Glowing
      if (!o.userData.glow || !o.material) return
      for (const m of [o.material].flat() as MrtMaterial[]) {
        if (m.mrtNode === glowOutput) continue
        m.mrtNode = glowOutput
        m.needsUpdate = true
      }
    })

  return {
    render: () => {
      markEmitters()
      pipeline.render()
    },
    dispose: () => {
      glow.dispose()
      scenePass.dispose()
      pipeline.dispose()
    },
  }
}
