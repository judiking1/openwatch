import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  MeshBasicMaterial,
} from 'three'
import { FILAMENTS, TOUCH_FILAMENTS } from './plasma'

/** Points along each filament path. */
export const SEGMENTS = 14
/** Filaments start this high above the dial at the electrodes. */
export const FILAMENT_Z = 1.6

/** Quad strips along each filament path: one draw for all filaments of a kind. */
function createRibbons(count: number) {
  const verts = count * (SEGMENTS + 1) * 2
  const geometry = new BufferGeometry()
  const position = new BufferAttribute(new Float32Array(verts * 3), 3)
  position.setUsage(DynamicDrawUsage)
  geometry.setAttribute('position', position)
  const index: number[] = []
  for (let f = 0; f < count; f++) {
    const base = f * (SEGMENTS + 1) * 2
    for (let i = 0; i < SEGMENTS; i++) {
      const a = base + i * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  geometry.setIndex(index)
  return geometry
}

/** Ribbons for the hour, minute and touch filaments, disposed together. */
export function ribbonSet() {
  const set = {
    hour: createRibbons(FILAMENTS.hour),
    minute: createRibbons(FILAMENTS.minute),
    touch: createRibbons(TOUCH_FILAMENTS),
  }
  return {
    ...set,
    dispose() {
      for (const geometry of Object.values(set)) geometry.dispose()
    },
  }
}

export function writeRibbon(
  geometry: BufferGeometry,
  filament: number,
  path: Float32Array,
  width: number,
  arc: number,
  lift: Float32Array,
  zEnd = FILAMENT_Z,
) {
  const out = geometry.getAttribute('position').array as Float32Array
  const base = filament * (SEGMENTS + 1) * 2 * 3
  for (let i = 0; i <= SEGMENTS; i++) {
    const j = Math.min(i + 1, SEGMENTS)
    const k = Math.max(i - 1, 0)
    const dx = path[j * 2] - path[k * 2]
    const dy = path[j * 2 + 1] - path[k * 2 + 1]
    const len = Math.hypot(dx, dy) || 1
    const f = i / SEGMENTS
    // Thinner at the electrodes, widest mid-arc.
    const w = (width / 2) * (0.35 + 0.65 * Math.sin(Math.PI * f))
    const nx = (-dy / len) * w
    const ny = (dx / len) * w
    const z = FILAMENT_Z + (zEnd - FILAMENT_Z) * f * f + arc * Math.sin(Math.PI * f) + lift[i]
    const o = base + i * 6
    out[o] = path[i * 2] + nx
    out[o + 1] = path[i * 2 + 1] + ny
    out[o + 2] = z
    out[o + 3] = path[i * 2] - nx
    out[o + 4] = path[i * 2 + 1] - ny
    out[o + 5] = z
  }
}

/** The white-hot core of every filament, one shared material so a strike lights all of them. */
export function createCoreMaterial() {
  return new MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}

/** A strike flashes the cores well above white (HDR, so the bloom flares with it). */
export function flashCores(material: MeshBasicMaterial, flash: number) {
  material.color.setScalar(1 + 3 * flash)
}
