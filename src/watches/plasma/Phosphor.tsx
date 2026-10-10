import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, Color, Matrix4, type InstancedMesh } from 'three'
import { BINS } from './plasma'

const BAND_WIDTH = 3.2
const BAND_Z = 0.4

/** A phosphor band: one small additive tile per bin, brightness via instance colour. */
export function Phosphor({
  ring,
  color,
  bandRef,
}: {
  ring: number
  color: string
  bandRef: (mesh: InstancedMesh | null) => void
}) {
  const local = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = local.current
    if (!mesh) return
    const m = new Matrix4()
    const black = new Color(0, 0, 0)
    for (let i = 0; i < BINS; i++) {
      const a = ((i + 0.5) / BINS) * Math.PI * 2
      m.makeRotationZ(-a).setPosition(ring * Math.sin(a), ring * Math.cos(a), BAND_Z)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, black)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [ring])
  const tile = (2 * Math.PI * ring) / BINS
  return (
    <instancedMesh
      ref={(mesh) => {
        local.current = mesh
        bandRef(mesh)
      }}
      args={[undefined, undefined, BINS]}
      frustumCulled={false}
      userData={{ lume: true }}
    >
      <planeGeometry args={[tile * 1.05, BAND_WIDTH]} />
      <meshBasicMaterial
        color={color}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
