import { useThree } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  RingGeometry,
  Scene,
  type BufferGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { useDisposable } from '../hooks'
import { getNodeLibrary } from '../renderer'

type Former = {
  form: 'rect' | 'ring'
  intensity: number
  position: [number, number, number]
  scale: [number, number]
}

/** The studio's light boxes (same layout as the former drei Lightformers). */
const FORMERS: Former[] = [
  { form: 'rect', intensity: 3, position: [0, 4, 4], scale: [8, 2] },
  { form: 'rect', intensity: 1.5, position: [-5, 0, 2], scale: [2, 8] },
  { form: 'rect', intensity: 1.5, position: [5, 0, 2], scale: [2, 8] },
  { form: 'ring', intensity: 2, position: [0, -3, 5], scale: [3, 3] },
  { form: 'rect', intensity: 0.6, position: [0, 0, -6], scale: [10, 10] },
]

function buildStudioScene(): { scene: Scene; dispose: () => void } {
  const scene = new Scene()
  scene.background = new Color(0x000000)
  const disposables: Array<BufferGeometry | MeshBasicMaterial> = []
  for (const f of FORMERS) {
    const geometry: BufferGeometry =
      f.form === 'ring' ? new RingGeometry(0.5, 1, 64) : new PlaneGeometry(1, 1)
    const material = new MeshBasicMaterial({
      color: new Color(f.intensity, f.intensity, f.intensity),
      side: DoubleSide,
      toneMapped: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.set(...f.position)
    mesh.scale.set(f.scale[0], f.scale[1], 1)
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
    disposables.push(geometry, material)
  }
  return { scene, dispose: () => disposables.forEach((d) => d.dispose()) }
}

type Generator = {
  fromScene: (scene: Scene, sigma?: number, near?: number, far?: number) => { texture: Texture }
  dispose: () => void
}

/**
 * Procedural studio reflections, pre-filtered with PMREM, for either renderer: the classic
 * `PMREMGenerator` on WebGL, the node-based one from `three/webgpu` on WebGPURenderer.
 * Replaces drei's <Environment> + <Lightformer>, whose cube-camera path is WebGL-only.
 * Must be a direct child of the scene: the result attaches to `scene.environment`.
 */
export function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  // The node renderer is already initialised (createWatchRenderer awaits init()), so the
  // synchronous bake works on both.
  const environment = useDisposable(() => {
    const library = getNodeLibrary(gl)
    const generator: Generator = library
      ? new library.PMREMGenerator(gl as never)
      : new PMREMGenerator(gl as WebGLRenderer)
    const studio = buildStudioScene()
    const target = generator.fromScene(studio.scene, 0, 0.1, 100)
    generator.dispose()
    studio.dispose()
    return target.texture
  }, [gl])

  return <primitive object={environment} attach="environment" />
}
