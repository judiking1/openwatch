import { Box3, type Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'

import bracelet from '../../assets/models/bracelet.glb?inline'
import crown from '../../assets/models/crown.glb?inline'
import lug from '../../assets/models/lug.glb?inline'
import strap from '../../assets/models/strap.glb?inline'

const FILES: Record<string, string> = {
  'strap.glb': strap,
  'bracelet.glb': bracelet,
  'crown.glb': crown,
  'lug.glb': lug,
}

/** The GLB bytes from Vite's inline (base64 data URL) import. */
function bytes(dataUrl: string) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer
}

async function bounds(file: string, name: string) {
  const buffer = bytes(FILES[file])
  const gltf = await new GLTFLoader().parseAsync(buffer, '')
  const mesh = gltf.scene.getObjectByName(name) as Mesh
  expect(mesh?.geometry.getAttribute('normal')).toBeDefined()
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
})
