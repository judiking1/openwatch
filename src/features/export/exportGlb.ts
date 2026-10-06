import type { Object3D } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import type { Appearance, WatchMetadata } from '../../types/watch'
import { prepareForExport } from './prepareForExport'

/** Models are authored in dial units (dial radius 100); export a ~40 mm watch in metres. */
const METRES_PER_DIAL_UNIT = 0.0002

export const EXPORT_DISCLAIMER =
  'Visual model only. Not mechanically accurate and not ready for manufacturing.'

export async function exportWatchGlb(
  root: Object3D,
  meta: WatchMetadata,
  appearance: Appearance,
): Promise<Blob> {
  const copy = prepareForExport(root)
  copy.position.set(0, 0, 0)
  copy.rotation.set(0, 0, 0)
  copy.scale.setScalar(METRES_PER_DIAL_UNIT)
  copy.name = `${meta.number} ${meta.name}`
  copy.userData = {
    concept: meta.id,
    name: meta.name,
    appVersion: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    appearance,
    disclaimer: EXPORT_DISCLAIMER,
  }

  const buffer = await new GLTFExporter().parseAsync(copy, { binary: true, onlyVisible: true })
  return new Blob([buffer as ArrayBuffer], { type: 'model/gltf-binary' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
