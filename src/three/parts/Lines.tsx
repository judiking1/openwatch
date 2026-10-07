import { Line } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ComponentProps } from 'react'
import { useDisposable } from '../hooks'
import { getNodeLibrary, type NodeLibrary } from '../renderer'

type P3 = [number, number, number]

type Props = {
  points: P3[]
  /** Pairs of points instead of one polyline. */
  segments?: boolean
  color: ComponentProps<typeof Line>['color']
  lineWidth?: number
  transparent?: boolean
  opacity?: number
}

/**
 * Wide lines on either renderer: drei `<Line>` (`LineMaterial`, a GLSL `ShaderMaterial`) on
 * WebGLRenderer, `LineSegments2` with `Line2NodeMaterial` on the node-based WebGPURenderer.
 */
export function Lines(props: Props) {
  const library = getNodeLibrary(useThree((s) => s.gl))
  return library ? <NodeLines library={library} {...props} /> : <Line {...props} />
}

function NodeLines({
  library,
  points,
  segments,
  color,
  lineWidth = 1,
  transparent = false,
  opacity = 1,
}: Props & { library: NodeLibrary }) {
  const lines = useDisposable(() => {
    const pairs = segments ? points : points.flatMap((p, i) => (i ? [points[i - 1], p] : []))
    return library.createFatLines(pairs.flat(), transparent)
  }, [library, points, segments, transparent])
  return (
    <primitive
      object={lines.object}
      material-color={color}
      material-linewidth={lineWidth}
      material-opacity={opacity}
    />
  )
}
