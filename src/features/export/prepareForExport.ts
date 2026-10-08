import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MeshStandardMaterial,
  type Color,
  type InterleavedBufferAttribute,
  type Material,
  type Mesh,
  type Object3D,
  type Texture,
} from 'three'

type FatLine = Mesh & {
  isLine2?: boolean
  isLineSegments2?: boolean
  material: Material & { color?: Color; opacity: number; transparent: boolean }
}

/** Fat lines (drei <Line>) render with a shader glTF cannot carry; export them as plain lines. */
function toPlainLines(line: FatLine): LineSegments {
  const start = line.geometry.getAttribute('instanceStart') as InterleavedBufferAttribute
  const end = line.geometry.getAttribute('instanceEnd') as InterleavedBufferAttribute
  const positions: number[] = []
  for (let i = 0; i < start.count; i++) {
    positions.push(start.getX(i), start.getY(i), start.getZ(i))
    positions.push(end.getX(i), end.getY(i), end.getZ(i))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const plain = new LineSegments(
    geometry,
    new LineBasicMaterial({
      color: line.material.color,
      transparent: line.material.transparent,
      opacity: line.material.opacity,
    }),
  )
  plain.name = line.name
  plain.position.copy(line.position)
  plain.quaternion.copy(line.quaternion)
  plain.scale.copy(line.scale)
  return plain
}

function isShader(material: Material) {
  return (
    (material as { isShaderMaterial?: boolean }).isShaderMaterial === true ||
    (material as { isRawShaderMaterial?: boolean }).isRawShaderMaterial === true
  )
}

type NodeMaterialLike = Material & {
  isNodeMaterial?: boolean
  color?: Color
  metalness?: number
  roughness?: number
  map?: Texture | null
}

/**
 * TSL node materials (WebGPURenderer) have no glTF equivalent: their look lives in a node
 * graph. Keep the plain properties they carry (or `userData.exportColor`) as a standard material.
 */
function fromNodeMaterial(m: NodeMaterialLike) {
  const exportColor = m.userData.exportColor as string | undefined
  return new MeshStandardMaterial({
    color: exportColor ?? m.color ?? '#8a8f99',
    metalness: m.metalness ?? 0,
    roughness: m.roughness ?? 0.5,
    map: exportColor ? null : (m.map ?? null),
    transparent: m.transparent,
    // A shader-like node graph (exportColor set) computes its own alpha; match the shader path.
    opacity: exportColor && m.transparent ? 0.85 : m.opacity,
    side: m.side === BackSide ? DoubleSide : m.side,
  })
}

/**
 * Returns a deep clone of `root` that the glTF exporter can write: custom shaders become
 * standard materials (node materials and shaders, using `material.userData.exportColor` when a concept provides one) and
 * fat lines become line segments. The live scene is not touched.
 */
export function prepareForExport(root: Object3D): Object3D {
  const copy = root.clone(true)
  const replacements: Array<[Object3D, Object3D]> = []

  // View helpers (blueprint edges, dimensions) are not part of the model.
  const helpers: Object3D[] = []
  copy.traverse((object) => {
    if (object.userData.helper) helpers.push(object)
  })
  helpers.forEach((h) => h.removeFromParent())

  copy.traverse((object) => {
    const line = object as FatLine
    if (line.isLine2 || line.isLineSegments2) {
      replacements.push([object, toPlainLines(line)])
      return
    }
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const fixed = materials.map((m) => {
      if ((m as NodeMaterialLike).isNodeMaterial) return fromNodeMaterial(m)
      if (isShader(m)) {
        return new MeshStandardMaterial({
          color: (m.userData.exportColor as string | undefined) ?? '#8a8f99',
          transparent: m.transparent,
          opacity: m.transparent ? 0.85 : 1,
          roughness: 0.3,
        })
      }
      // glTF only knows single- or double-sided; back-face-only surfaces (bowls, recesses)
      // would vanish, so export them double-sided.
      if (m.side === BackSide) {
        const copy = m.clone()
        copy.side = DoubleSide
        return copy
      }
      return m
    })
    mesh.material = Array.isArray(mesh.material) ? fixed : fixed[0]

    // A shader that clipped the mesh (e.g. a liquid level) can declare the visible fraction
    // of its height; bake it into the exported geometry's transform, bottom-anchored.
    const fill = mesh.userData.exportFillFraction as number | undefined
    if (fill !== undefined) {
      mesh.geometry.computeBoundingBox()
      const height = mesh.geometry.boundingBox!.max.y - mesh.geometry.boundingBox!.min.y
      mesh.position.y -= (height * mesh.scale.y * (1 - fill)) / 2
      mesh.scale.y *= Math.max(fill, 1e-3)
    }
  })

  for (const [from, to] of replacements) {
    from.parent?.add(to)
    from.removeFromParent()
  }
  return copy
}
