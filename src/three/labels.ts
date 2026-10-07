import { CanvasTexture, SRGBColorSpace } from 'three'
import { useDisposable } from './hooks'
import { createLabelCanvas, dialFont } from './utils/canvas'

/**
 * One white-on-transparent texture per label. Tint with the material colour, so colour
 * changes never re-rasterise text (rendering-and-webgpu.md §2.3).
 */
export function useLabelMasks(labels: string[], weight = 600) {
  return useDisposable(() => {
    const textures = labels.map((text) => {
      const t = new CanvasTexture(createLabelCanvas(text, dialFont(weight, 64), '#ffffff'))
      t.colorSpace = SRGBColorSpace
      return t
    })
    return { textures, dispose: () => textures.forEach((t) => t.dispose()) }
  }, [labels, weight]).textures
}
