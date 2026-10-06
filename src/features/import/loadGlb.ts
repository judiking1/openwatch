import { Box3, Vector3, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type HandName = 'hour' | 'minute' | 'second'
export const HAND_NAMES: HandName[] = ['hour', 'minute', 'second']

export type LoadedModel = {
  scene: Object3D
  /** Nodes found by the naming convention, animated by the clock. */
  hands: Partial<Record<HandName, Object3D>>
  stats: { nodes: number; meshes: number; materials: number; triangles: number }
  /** `extras` of the first node, e.g. the metadata this app writes into its exports. */
  extras: Record<string, unknown>
  /** Bounding box size and centre in the file's own units (measured before display). */
  size: Vector3
  centre: Vector3
}

/**
 * Finds the animated parts by name: a node called (or starting with) `hour`, `minute` or
 * `second`, case-insensitive. Exports from this app already follow the convention.
 */
export function findHands(root: Object3D): Partial<Record<HandName, Object3D>> {
  const hands: Partial<Record<HandName, Object3D>> = {}
  root.traverse((node) => {
    const name = node.name.toLowerCase()
    for (const hand of HAND_NAMES) {
      if (
        !hands[hand] &&
        (name === hand || name.startsWith(`${hand}_`) || name.startsWith(`${hand}.`))
      ) {
        hands[hand] = node
      }
    }
  })
  return hands
}

export async function loadGlb(data: ArrayBuffer): Promise<LoadedModel> {
  const gltf = await new GLTFLoader().parseAsync(data, '')
  const scene = gltf.scene
  let meshes = 0
  let triangles = 0
  let nodes = 0
  const materials = new Set<string>()
  scene.traverse((node) => {
    nodes++
    const mesh = node as Object3D & {
      isMesh?: boolean
      geometry?: { index: { count: number } | null; attributes: { position?: { count: number } } }
      material?: { uuid: string } | Array<{ uuid: string }>
    }
    if (!mesh.isMesh || !mesh.geometry) return
    meshes++
    const g = mesh.geometry
    triangles += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (m) materials.add(m.uuid)
    }
  })
  const first = scene.children[0]
  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const centre = box.getCenter(new Vector3())
  return {
    scene,
    hands: findHands(scene),
    stats: { nodes, meshes, materials: materials.size, triangles: Math.round(triangles) },
    extras: (first?.userData ?? {}) as Record<string, unknown>,
    size,
    centre,
  }
}
