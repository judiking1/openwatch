export type CrystalAppearance = {
  crystalTint: string
  crystalOpacity: number
}

/** Flat sapphire-like crystal covering the dial. */
export function Crystal({
  crystalTint,
  crystalOpacity,
  radius = 104,
  z = 9,
}: CrystalAppearance & { radius?: number; z?: number }) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
      <cylinderGeometry args={[radius, radius, 1.2, 96]} />
      <meshPhysicalMaterial
        color={crystalTint}
        transparent
        opacity={crystalOpacity}
        roughness={0.02}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0}
        depthWrite={false}
      />
    </mesh>
  )
}
