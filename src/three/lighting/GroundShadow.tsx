import { CanvasTexture } from 'three'
import { useDisposable } from '../hooks'

function shadowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

/**
 * A soft blob on the floor under the watch. Static and renderer-agnostic, unlike drei's
 * ContactShadows, which re-rendered the whole model from below every frame.
 */
export function GroundShadow({ y = -2.9, opacity = 0.45 }: { y?: number; opacity?: number }) {
  const texture = useDisposable(() => shadowTexture(), [])
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.4, 2.2, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}
