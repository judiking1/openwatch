import { Box3, type Mesh } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'

import bezel from '../../assets/models/bezel.glb?inline'
import bracelet from '../../assets/models/bracelet.glb?inline'
import caseback from '../../assets/models/caseback.glb?inline'
import crown from '../../assets/models/crown.glb?inline'
import lug from '../../assets/models/lug.glb?inline'
import strap from '../../assets/models/strap.glb?inline'

const FILES: Record<string, string> = {
  'strap.glb': strap,
  'bracelet.glb': bracelet,
  'crown.glb': crown,
  'lug.glb': lug,
  'bezel.glb': bezel,
  'caseback.glb': caseback,
}

/** The GLB bytes from Vite's inline (base64 data URL) import. */
function bytes(dataUrl: string) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer
}

async function bounds(file: string, name: string) {
  const buffer = bytes(FILES[file])
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, '')
  const mesh = gltf.scene.getObjectByName(name) as Mesh
  expect(mesh?.geometry.getAttribute('normal')).toBeDefined()
  expect(mesh?.geometry.getAttribute('uv')).toBeDefined()
  mesh.geometry.computeBoundingBox()
  return { box: mesh.geometry.boundingBox as Box3, tris: mesh.geometry.index!.count / 3 }
}

describe('Blender body assets (dial units, Z-up)', () => {
  it('strap starts at the lug bar, is 62 wide and bends back around the wrist', async () => {
    const { box, tris } = await bounds('strap.glb', 'strap')
    expect(box.min.y).toBeCloseTo(0, 0)
    expect(box.max.x - box.min.x).toBeCloseTo(62, 0)
    expect(box.min.z).toBeLessThan(-40)
    expect(tris).toBeLessThan(20000)
  })

  it('bracelet follows the same path', async () => {
    const { box } = await bounds('bracelet.glb', 'bracelet')
    expect(box.min.y).toBeGreaterThan(-1)
    expect(box.max.x - box.min.x).toBeLessThan(63)
    expect(box.min.z).toBeLessThan(-40)
  })

  it('crown sits on +x from the case side', async () => {
    const { box } = await bounds('crown.glb', 'crown')
    expect(box.min.x).toBeCloseTo(-5, 1)
    expect(box.max.x).toBeCloseTo(12.2, 1)
    expect(box.max.y).toBeCloseTo(8, 0)
  })

  it('lug is centred, 34 long and 14 wide', async () => {
    const { box } = await bounds('lug.glb', 'lug')
    expect(box.max.y - box.min.y).toBeCloseTo(34, 0)
    expect(box.max.x - box.min.x).toBeCloseTo(14, 0)
  })

  it('bezel seats the crystal (radius 104 at z ≈ 9) and matches the case edge', async () => {
    const { box } = await bounds('bezel.glb', 'bezel')
    expect(box.max.x).toBeCloseTo(114, 0)
    expect(box.max.z).toBeGreaterThan(9.6)
    expect(box.min.z).toBeCloseTo(-1, 1)
  })

  it('caseback hangs below z = 0 and fits under the case', async () => {
    const { box, tris } = await bounds('caseback.glb', 'caseback')
    expect(box.max.z).toBeCloseTo(0, 1)
    expect(box.min.z).toBeCloseTo(-4.2, 1)
    expect(box.max.x).toBeLessThanOrEqual(110.01)
    expect(tris).toBeLessThan(30000)
  })
})
