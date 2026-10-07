import { Line } from '@react-three/drei'
import type { ComponentProps } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useDisposable } from '../hooks'
import { useRendererKind } from '../renderer'

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
 * drei `<Line>` (fat lines, `LineMaterial`) on WebGLRenderer. `LineMaterial` is a
 * `ShaderMaterial` that the node-based WebGPURenderer cannot compile, so there the lines
 * fall back to hairline `LineSegments` with a `LineBasicMaterial` (width is ignored).
 */
export function Lines(props: Props) {
  const { nodes } = useRendererKind()
  return nodes ? <ThinLines {...props} /> : <Line {...props} />
}

function ThinLines({ points, segments, color, transparent, opacity = 1 }: Props) {
  const geometry = useDisposable(() => {
    const list = segments ? points : points.flatMap((p, i) => (i ? [points[i - 1], p] : []))
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(list.flat(), 3))
  }, [points, segments])
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent={transparent} opacity={opacity} />
    </lineSegments>
  )
}
