import type { ReactNode, Ref } from 'react'
import type { Group } from 'three'
import { DIAL_RADIUS } from '../utils/dial'

export type CaseAppearance = {
  caseColor: string
  caseRoughness: number
  strapColor: string
  strapStyle: 'leather' | 'fabric' | 'metal'
}

type Props = CaseAppearance & {
  /** Inner (dial-side) radius of the case opening, in dial units. */
  radius?: number
  children?: ReactNode
  /**
   * The head (case, bezel, crown and everything inside) is wrapped in this group,
   * separate from the lugs and strap, so a concept can move the head itself.
   */
  headRef?: Ref<Group>
}

type StrapSegment = { y: number; z: number; tilt: number; length: number }

/**
 * Strap path: a short straight run from the lugs, then an arc bending back
 * around an imaginary wrist. Built from overlapping thin segments.
 */
function strapSegments(startY: number, startZ: number): StrapSegment[] {
  const segments: StrapSegment[] = []
  const straight = 24
  const bend = 110
  const sweep = 1.2
  const count = 14
  segments.push({ y: startY + straight / 2, z: startZ, tilt: 0, length: straight + 2 })
  const step = sweep / count
  const length = bend * step + 1.5
  for (let i = 0; i < count; i++) {
    const a = (i + 0.5) * step
    segments.push({
      y: startY + straight + bend * Math.sin(a),
      z: startZ - bend * (1 - Math.cos(a)),
      tilt: a,
      length,
    })
  }
  return segments
}

function strapMaterial(style: CaseAppearance['strapStyle'], color: string) {
  switch (style) {
    case 'metal':
      return <meshStandardMaterial color={color} metalness={1} roughness={0.25} />
    case 'fabric':
      return <meshStandardMaterial color={color} metalness={0} roughness={1} />
    case 'leather':
      return <meshStandardMaterial color={color} metalness={0} roughness={0.6} />
  }
}

/**
 * Generic watch body in dial units (dial radius ≈ 100), dial plane at z = 0,
 * facing +z. Children are rendered inside the case on the dial plane.
 */
export function WatchCase({
  caseColor,
  caseRoughness,
  strapColor,
  strapStyle,
  radius = DIAL_RADIUS,
  children,
  headRef,
}: Props) {
  const metal = <meshStandardMaterial color={caseColor} metalness={1} roughness={caseRoughness} />
  const outer = radius + 14
  const strap = strapSegments(outer + 6, -8)

  return (
    <group>
      <group ref={headRef}>
        {/* case middle */}
        <mesh position={[0, 0, -9]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[outer, outer - 3, 16, 128]} />
          {metal}
        </mesh>
        {/* bezel */}
        <mesh position={[0, 0, 3]}>
          <torusGeometry args={[radius + 6, 7, 32, 128]} />
          {metal}
        </mesh>
        {/* caseback */}
        <mesh position={[0, 0, -18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[outer - 8, outer - 4, 4, 96]} />
          {metal}
        </mesh>
        {/* crown */}
        <group position={[outer + 4, 0, -6]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[8, 8, 12, 32]} />
            {metal}
          </mesh>
          <mesh position={[0, -7, 0]}>
            <cylinderGeometry args={[4, 4, 4, 24]} />
            {metal}
          </mesh>
        </group>
        {children}
      </group>
      {/* lugs */}
      {[-1, 1].map((sy) =>
        [-1, 1].map((sx) => (
          <mesh key={`${sx}${sy}`} position={[sx * 38, sy * (outer + 10), -8]}>
            <boxGeometry args={[14, 34, 14]} />
            {metal}
          </mesh>
        )),
      )}
      {/* strap */}
      {[-1, 1].map((sy) => (
        <group key={sy} scale={[1, sy, 1]}>
          {strap.map((s, i) => (
            <mesh key={i} position={[0, s.y, s.z]} rotation={[s.tilt, 0, 0]}>
              <boxGeometry args={[62, s.length, 6]} />
              {strapMaterial(strapStyle, strapColor)}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
