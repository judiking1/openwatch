import { useGLTF } from '@react-three/drei'
import type { BufferGeometry, Mesh, Object3D } from 'three'
import bezelUrl from '../../assets/models/bezel.glb?url'
import braceletUrl from '../../assets/models/bracelet.glb?url'
import casebackUrl from '../../assets/models/caseback.glb?url'
import crownUrl from '../../assets/models/crown.glb?url'
import lugUrl from '../../assets/models/lug.glb?url'
import strapUrl from '../../assets/models/strap.glb?url'

/**
 * Watch-body parts modelled in Blender (`blender/generate_assets.py`, Phase 8) and shipped
 * as small GLBs, in dial units:
 * - `strap`: one leather strap side starting at the lug bar (y = 0, z = 0) and bending back;
 * - `bracelet`: the same path as three-piece links;
 * - `crown`: fluted crown on its tube along +x, from the case side at x = 0;
 * - `lug`: one lug horn, its tip towards +y;
 * - `bezel`: the bezel ring for the 100-unit dial (crystal seat, coin edge), at z = 0;
 * - `caseback`: the engraved back, its top at z = 0 and its engraved face towards −z.
 * The files are meshopt-compressed (decoded by the GLTF loader), not quantised.
 * Only geometry is used; materials come from the case appearance.
 */
const URLS = [strapUrl, braceletUrl, crownUrl, lugUrl, bezelUrl, casebackUrl]
const NAMES = ['strap', 'bracelet', 'crown', 'lug', 'bezel', 'caseback'] as const

export type BodyAssets = Record<(typeof NAMES)[number], BufferGeometry>

function geometryOf(scene: Object3D, name: string) {
  const mesh = scene.getObjectByName(name) as Mesh | undefined
  if (!mesh?.geometry) throw new Error(`body asset "${name}" has no mesh`)
  return mesh.geometry
}

/** Loads (once, cached) and returns the body geometries; suspends while loading. */
export function useBodyAssets(): BodyAssets {
  const gltfs = useGLTF(URLS)
  return Object.fromEntries(
    NAMES.map((name, i) => [name, geometryOf(gltfs[i].scene, name)]),
  ) as BodyAssets
}

/** Starts loading the body assets before the first watch needs them. */
export function preloadBodyAssets() {
  for (const url of URLS) useGLTF.preload(url)
}
