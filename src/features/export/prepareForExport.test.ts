import { describe, expect, it } from 'vitest'
import {
  BackSide,
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  type Material,
} from 'three'
import { prepareForExport } from './prepareForExport'

function exported(material: Material) {
  const root = new Group().add(new Mesh(new BoxGeometry(), material))
  return (prepareForExport(root).children[0] as Mesh).material as MeshStandardMaterial
}

describe('prepareForExport', () => {
  it('replaces node materials with standard ones carrying their plain properties', () => {
    // Stands in for a MeshStandardNodeMaterial: same properties plus the node flag.
    const node = Object.assign(
      new MeshStandardMaterial({ color: '#336699', metalness: 1, roughness: 0.3 }),
      { isNodeMaterial: true },
    )
    const out = exported(node)
    expect(out).not.toBe(node)
    expect(out.isMeshStandardMaterial).toBe(true)
    expect(out.color.getHexString()).toBe('336699')
    expect(out.metalness).toBe(1)
    expect(out.roughness).toBeCloseTo(0.3)
  })

  it('prefers userData.exportColor for node and shader materials', () => {
    const node = Object.assign(new MeshStandardMaterial({ side: BackSide }), {
      isNodeMaterial: true,
    })
    node.userData.exportColor = '#a0c8e8'
    const out = exported(node)
    expect(out.color.getHexString()).toBe('a0c8e8')
    expect(out.side).toBe(DoubleSide)

    const shader = new ShaderMaterial()
    shader.userData.exportColor = '#112233'
    expect(exported(shader).color.getHexString()).toBe('112233')
  })

  it('keeps ordinary materials, but exports back faces double-sided', () => {
    const plain = new MeshStandardMaterial()
    expect(exported(plain)).toBe(plain)
    expect(exported(new MeshStandardMaterial({ side: BackSide })).side).toBe(DoubleSide)
  })
})
