import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import type { BloomSettings } from '../../types/watch'
import { useDisposable } from '../hooks'
import { getNodeLibrary, type NodeLibrary } from '../renderer'

type WebGLBloomModule = typeof import('./webglBloom')

/**
 * Bloom for the stage on either renderer. Takes over R3F's render with a frame callback of
 * positive priority. WebGPURenderer: the TSL pipeline from the lazy node library, glowing
 * only meshes marked `userData.glow` (MRT). WebGLRenderer: an EffectComposer with
 * UnrealBloomPass, loaded on demand, selecting by threshold alone.
 */
export function StageBloom({ settings }: { settings: BloomSettings }) {
  const library = getNodeLibrary(useThree((s) => s.gl))
  return library ? (
    <NodeBloom library={library} settings={settings} />
  ) : (
    <WebGLBloom settings={settings} />
  )
}

function NodeBloom({ library, settings }: { library: NodeLibrary; settings: BloomSettings }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const { strength, radius, threshold } = settings
  const pipeline = useDisposable(
    () => library.createBloomPipeline(gl, scene, camera, { strength, radius, threshold }),
    [library, gl, scene, camera, strength, radius, threshold],
  )
  useFrame(() => pipeline.render(), 1)
  return null
}

function WebGLBloom({ settings }: { settings: BloomSettings }) {
  const [module, setModule] = useState<WebGLBloomModule | null>(null)
  useEffect(() => {
    let live = true
    void import('./webglBloom').then((m) => live && setModule(m))
    return () => {
      live = false
    }
  }, [])
  return module ? <Composer module={module} settings={settings} /> : null
}

function Composer({ module, settings }: { module: WebGLBloomModule; settings: BloomSettings }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const { strength, radius, threshold } = settings
  const bloom = useDisposable(
    () => module.createWebGLBloom(gl, scene, camera, { strength, radius, threshold }),
    [module, gl, scene, camera, strength, radius, threshold],
  )
  useEffect(() => bloom.setSize(size.width, size.height, dpr), [bloom, size, dpr])
  useFrame(() => bloom.render(), 1)
  return null
}
