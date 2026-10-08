import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  type BufferGeometry,
  type Group,
  type Material,
  type Mesh,
  type Texture,
} from 'three'
import { useStageStore } from '../../stores/stageStore'
import { BLUEPRINT, EDGE_ANGLE } from './blueprint'

type Drawn = Mesh & {
  userData: {
    blueprintOriginal?: Material | Material[]
    blueprintEdges?: LineSegments
    blueprintVersion?: number
    helper?: boolean
  }
}

/**
 * Technical-drawing view: every mesh is filled flat in blueprint blue and outlined by its
 * feature edges (EdgesGeometry); see-through parts keep only their edges and printed masks
 * are drawn in line colour. Edges are rebuilt when a geometry changes (animated
 * outlines such as Iris's blades); instanced meshes stay as flat fills. Turning it off
 * restores the original materials and removes the edges.
 */
export function BlueprintController({ root }: { root: RefObject<Group | null> }) {
  const fill = useMemo(
    () =>
      new MeshBasicMaterial({
        color: BLUEPRINT.fill,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [],
  )
  const line = useMemo(() => new LineBasicMaterial({ color: BLUEPRINT.line }), [])
  // Glass and other see-through parts: edges only.
  const clear = useMemo(() => new MeshBasicMaterial({ visible: false }), [])
  // Printed masks (white on transparent) are drawn in line colour, one material per mask.
  const prints = useRef(new Map<Texture, MeshBasicMaterial>())
  const blueprintMaterial = (original: Material | Material[]) => {
    const m = (Array.isArray(original) ? original[0] : original) as Material & {
      map?: Texture | null
    }
    if (!m.transparent) return fill
    if (!m.map) return clear
    let print = prints.current.get(m.map)
    if (!print) {
      print = new MeshBasicMaterial({
        map: m.map,
        color: BLUEPRINT.line,
        transparent: true,
        depthWrite: false,
      })
      prints.current.set(m.map, print)
    }
    return print
  }
  const active = useRef(false)

  useFrame(() => {
    const on = useStageStore.getState().blueprint
    const model = root.current
    if (!model || (!on && !active.current)) return
    active.current = on
    const meshes: Drawn[] = []
    model.traverse((o) => {
      const mesh = o as Drawn
      if (mesh.isMesh && !mesh.userData.helper) meshes.push(mesh)
    })
    for (const mesh of meshes) {
      const data = mesh.userData
      if (!on) {
        if (data.blueprintOriginal) mesh.material = data.blueprintOriginal
        data.blueprintEdges?.removeFromParent()
        data.blueprintEdges?.geometry.dispose()
        delete data.blueprintOriginal
        delete data.blueprintEdges
        delete data.blueprintVersion
        continue
      }
      data.blueprintOriginal ??= mesh.material
      mesh.material = blueprintMaterial(data.blueprintOriginal)
      if ((mesh as { isInstancedMesh?: boolean }).isInstancedMesh) continue
      const version = (mesh.geometry.getAttribute('position') as { version?: number }).version ?? 0
      if (data.blueprintEdges && data.blueprintVersion === version) continue
      data.blueprintEdges?.geometry.dispose()
      const edges = data.blueprintEdges ?? new LineSegments(undefined, line)
      edges.geometry = new EdgesGeometry(mesh.geometry as BufferGeometry, EDGE_ANGLE)
      edges.userData.helper = true
      edges.raycast = () => {}
      if (!data.blueprintEdges) mesh.add(edges)
      data.blueprintEdges = edges
      data.blueprintVersion = version
    }
  })
  return null
}
