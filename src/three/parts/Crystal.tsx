import { useThree } from '@react-three/fiber'
import { useDisposable } from '../hooks'
import { EXPLODE_LIFT } from '../stage/explode'
import { getNodeLibrary, LINEAR_OPACITY, useLinearBlending, type NodeLibrary } from '../renderer'

export type CrystalAppearance = {
  crystalTint: string
  crystalOpacity: number
}

/** Rises first in the exploded view. */
const LIFT = { explode: EXPLODE_LIFT.crystal }

type Props = CrystalAppearance & { radius?: number; z?: number }

/** Flat sapphire-like crystal covering the dial. */
export function Crystal({ crystalTint, crystalOpacity, radius = 104, z = 9 }: Props) {
  const library = getNodeLibrary(useThree((s) => s.gl))
  const linear = useLinearBlending()
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} renderOrder={10} userData={LIFT}>
      <cylinderGeometry args={[radius, radius, 1.2, 96]} />
      {library ? (
        <SapphireMaterial library={library} tint={crystalTint} opacity={crystalOpacity} />
      ) : (
        <meshPhysicalMaterial
          color={crystalTint}
          transparent
          opacity={linear ? crystalOpacity * LINEAR_OPACITY : crystalOpacity}
          roughness={0.02}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          depthWrite={false}
        />
      )}
    </mesh>
  )
}

/** WebGPURenderer: the TSL sapphire (Fresnel coverage, tuned for linear blending). */
function SapphireMaterial({
  library,
  tint,
  opacity,
}: {
  library: NodeLibrary
  tint: string
  opacity: number
}) {
  const material = useDisposable(() => library.createSapphire({}), [library])
  return <primitive object={material} attach="material" color={tint} opacity={opacity} />
}
