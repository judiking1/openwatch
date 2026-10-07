import type { ColorRepresentation, Texture } from 'three'

type Props = {
  /** White-on-transparent mask (markings, numerals). */
  mask: Texture
  /** Tint for the mask; changing it never re-rasterises the texture. */
  color: ColorRepresentation
  /** A disc of this radius, or a ring when `inner` is given. */
  radius: number
  inner?: number
  z?: number
  roughness?: number
  metalness?: number
  /** Optional emission in the tint colour (luminous print). */
  emissive?: number
  name?: string
}

/** Prints glow in the lume (night) view. */
const LUMINOUS = { lume: true }

/**
 * Printed markings as a separate tinted layer above a plain-coloured base. Dials are
 * split into base colour + mask (rendering-and-webgpu.md §2.3): colour pickers only touch
 * material uniforms, and the mask is drawn once per layout.
 */
export function PrintLayer({
  mask,
  color,
  radius,
  inner,
  z = 0.05,
  roughness = 0.7,
  metalness = 0.1,
  emissive = 0,
  name,
}: Props) {
  return (
    <mesh position={[0, 0, z]} name={name} userData={LUMINOUS}>
      {inner === undefined ? (
        <circleGeometry args={[radius, 128]} />
      ) : (
        <ringGeometry args={[inner, radius, 128]} />
      )}
      <meshStandardMaterial
        map={mask}
        color={color}
        emissive={color}
        emissiveIntensity={emissive}
        emissiveMap={mask}
        transparent
        depthWrite={false}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  )
}
