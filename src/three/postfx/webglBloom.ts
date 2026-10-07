import { Vector2, type Camera, type Scene, type WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { BloomSettings } from '../../types/watch'

/**
 * Bloom on WebGLRenderer: the scene into a half-float target (no tone mapping yet), an
 * Unreal bloom of everything above `threshold` in linear HDR, then tone mapping and sRGB in
 * the output pass. There is no per-mesh selection here: the threshold alone keeps ordinary
 * lit surfaces out, which works because emitters are unlit and over-bright.
 */
export function createWebGLBloom(
  renderer: unknown,
  scene: Scene,
  camera: Camera,
  { strength, radius, threshold }: BloomSettings,
) {
  const gl = renderer as WebGLRenderer
  const composer = new EffectComposer(gl)
  composer.addPass(new RenderPass(scene, camera))
  const size = gl.getSize(new Vector2())
  composer.addPass(new UnrealBloomPass(size, strength, radius, threshold))
  composer.addPass(new OutputPass())
  return {
    render: () => composer.render(),
    setSize: (width: number, height: number, dpr: number) => {
      composer.setPixelRatio(dpr)
      composer.setSize(width, height)
    },
    dispose: () => composer.dispose(),
  }
}
