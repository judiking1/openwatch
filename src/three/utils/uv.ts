import type { BufferGeometry } from 'three'

/**
 * Replaces a geometry's UVs with a planar projection over a square of half-size `extent`
 * centred on the origin, so several meshes (e.g. concentric rings) can share one texture
 * drawn in dial coordinates.
 */
export function planarUV<G extends BufferGeometry>(geometry: G, extent: number): G {
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / (2 * extent) + 0.5, position.getY(i) / (2 * extent) + 0.5)
  }
  uv.needsUpdate = true
  return geometry
}
