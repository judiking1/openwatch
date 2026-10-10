import type { BufferGeometry, MeshBasicMaterial } from 'three'
import { AdditiveBlending } from 'three'

/** Filament ribbons: a violet additive halo and a white-hot core (HDR, blooms). */
export function Filaments({
  halo,
  core,
  color,
  coreMaterial,
}: {
  halo: BufferGeometry
  core: BufferGeometry
  color: string
  coreMaterial: MeshBasicMaterial
}) {
  return (
    <>
      <mesh geometry={halo} frustumCulled={false}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={core} material={coreMaterial} frustumCulled={false} />
    </>
  )
}
