import { useThree } from '@react-three/fiber'
import type { ReactNode, Ref } from 'react'
import { BackSide, BoxGeometry, Matrix4, MeshStandardMaterial, type Group } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useDisposable } from '../hooks'
import { getNodeLibrary } from '../renderer'
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
  /**
   * Depth of a recess below the dial plane (dial units). 0 = the usual flat dial seat.
   * Concepts with bowls or tilting parts use it; the case grows thicker to fit.
   */
  cavityDepth?: number
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

const STRAP_FINISH: Record<CaseAppearance['strapStyle'], { metalness: number; roughness: number }> =
  {
    metal: { metalness: 1, roughness: 0.25 },
    fabric: { metalness: 0, roughness: 1 },
    leather: { metalness: 0, roughness: 0.6 },
  }

/** One strap side as a single static mesh: all segments merged into one geometry. */
function strapGeometry(segments: StrapSegment[]) {
  const parts = segments.map((s) =>
    new BoxGeometry(62, s.length, 6).applyMatrix4(
      new Matrix4().makeRotationX(s.tilt).setPosition(0, s.y, s.z),
    ),
  )
  const merged = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return merged
}

/** The four lugs as one geometry. */
function lugGeometry(outer: number) {
  const parts = [-1, 1].flatMap((sy) =>
    [-1, 1].map((sx) => new BoxGeometry(14, 34, 14).translate(sx * 38, sy * (outer + 10), -8)),
  )
  const merged = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return merged
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
  cavityDepth = 0,
}: Props) {
  const outer = radius + 14
  const seat = radius + 1
  /** Underside of the case middle; the caseback sits below it. */
  const bottom = -Math.max(17, cavityDepth + 5)

  // One material per finish, shared by every part that uses it. On WebGPURenderer the case
  // metal is the TSL brushed finish; WebGL keeps the plain standard material.
  const library = getNodeLibrary(useThree((s) => s.gl))
  const makeMetal = library?.createBrushedMetal ?? ((p) => new MeshStandardMaterial(p))
  const metal = useDisposable(
    () => makeMetal({ color: caseColor, metalness: 1, roughness: caseRoughness }),
    [caseColor, caseRoughness, library],
  )
  const metalInside = useDisposable(
    () => makeMetal({ color: caseColor, metalness: 1, roughness: caseRoughness, side: BackSide }),
    [caseColor, caseRoughness, library],
  )
  const strapMaterial = useDisposable(
    () => new MeshStandardMaterial({ color: strapColor, ...STRAP_FINISH[strapStyle] }),
    [strapColor, strapStyle],
  )
  const strap = useDisposable(() => strapGeometry(strapSegments(outer + 6, -8)), [outer])
  const lugs = useDisposable(() => lugGeometry(outer), [outer])

  return (
    <group>
      <group ref={headRef}>
        {/* case middle: outer wall, top ring and the seat (or recess) for the dial */}
        <mesh
          position={[0, 0, (-1 + bottom) / 2]}
          rotation={[Math.PI / 2, 0, 0]}
          material={metal}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[outer, outer - 3, -1 - bottom, 128, 1, true]} />
        </mesh>
        <mesh position={[0, 0, -1]} material={metal}>
          <ringGeometry args={[seat, outer, 128]} />
        </mesh>
        {cavityDepth > 0 && (
          <mesh
            position={[0, 0, -1 - cavityDepth / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            material={metalInside}
          >
            <cylinderGeometry args={[seat, seat, cavityDepth, 128, 1, true]} />
          </mesh>
        )}
        <mesh position={[0, 0, -1 - cavityDepth]} material={metal}>
          <circleGeometry args={[seat, 128]} />
        </mesh>
        {/* bezel */}
        <mesh position={[0, 0, 3]} material={metal}>
          <torusGeometry args={[radius + 6, 7, 32, 128]} />
        </mesh>
        {/* caseback */}
        <mesh position={[0, 0, bottom - 1]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
          <cylinderGeometry args={[outer - 8, outer - 4, 4, 96]} />
        </mesh>
        {/* crown */}
        <group position={[outer + 4, 0, -6]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={metal}>
            <cylinderGeometry args={[8, 8, 12, 32]} />
          </mesh>
          <mesh position={[0, -7, 0]} material={metal}>
            <cylinderGeometry args={[4, 4, 4, 24]} />
          </mesh>
        </group>
        {children}
      </group>
      {/* lugs and strap: static, each a single merged mesh */}
      <mesh geometry={lugs} material={metal} />
      {[-1, 1].map((sy) => (
        <mesh key={sy} geometry={strap} material={strapMaterial} scale={[1, sy, 1]} />
      ))}
    </group>
  )
}
