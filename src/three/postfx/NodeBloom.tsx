import { useFrame, useThree } from '@react-three/fiber'
import type { BloomSettings } from '../../types/watch'
import { useDisposable } from '../hooks'
import { getNodeLibrary, type NodeLibrary } from '../renderer'

/**
 * Bloom for the stage on WebGPURenderer: takes over R3F's render (a frame callback with a
 * positive priority) and draws through the TSL pipeline instead. Renders nothing and changes
 * nothing on WebGLRenderer.
 */
export function NodeBloom({ settings }: { settings: BloomSettings }) {
  const library = getNodeLibrary(useThree((s) => s.gl))
  return library ? <BloomPass library={library} settings={settings} /> : null
}

function BloomPass({ library, settings }: { library: NodeLibrary; settings: BloomSettings }) {
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
