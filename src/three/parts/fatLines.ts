import { Line2NodeMaterial } from 'three/webgpu'
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'

/**
 * Screen-space wide line segments for WebGPURenderer (`Line2NodeMaterial`), the node twin
 * of drei's `<Line>` / `LineMaterial`. `positions` are flat xyz pairs, one pair per segment.
 */
export function createFatLines(positions: number[], transparent: boolean) {
  const geometry = new LineSegmentsGeometry().setPositions(positions)
  const material = new Line2NodeMaterial({ transparent })
  const object = new LineSegments2(geometry, material)
  return {
    object,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}
