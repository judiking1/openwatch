import { useThree } from '@react-three/fiber'
import type { ReactNode, Ref } from 'react'
import { BackSide, Matrix4, MeshStandardMaterial, type BufferGeometry, type Group } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useDisposable } from '../hooks'
import { getNodeLibrary } from '../renderer'
import { EXPLODE_LIFT } from '../stage/explode'
import { DIAL_RADIUS } from '../utils/dial'
import { useBodyAssets } from './bodyAssets'

/** Exploded-view lifts (see `stage/explode.ts`). */
const BEZEL = { explode: EXPLODE_LIFT.bezel }
const CASEBACK = { explode: EXPLODE_LIFT.caseback }

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

const STRAP_FINISH: Record<CaseAppearance['strapStyle'], { metalness: number; roughness: number }> =
  {
    metal: { metalness: 1, roughness: 0.25 },
    fabric: { metalness: 0, roughness: 1 },
    leather: { metalness: 0, roughness: 0.6 },
  }

/** The four lugs as one geometry: the Blender lug placed and mirrored at each corner. */
function lugGeometry(lug: BufferGeometry, outer: number) {
  const parts = [-1, 1].flatMap((sy) =>
    [-1, 1].map((sx) =>
      lug
        .clone()
        .applyMatrix4(
          new Matrix4().makeScale(sx, sy, 1).setPosition(sx * 38, sy * (outer + 10), -8),
        ),
    ),
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
  const assets = useBodyAssets()
  const lugs = useDisposable(() => lugGeometry(assets.lug, outer), [assets.lug, outer])
  const strap = strapStyle === 'metal' ? assets.bracelet : assets.strap

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
        {/* bezel and engraved caseback (Blender, modelled for the 100-unit dial) */}
        <mesh
          geometry={assets.bezel}
          scale={[radius / DIAL_RADIUS, radius / DIAL_RADIUS, 1]}
          material={metal}
          userData={BEZEL}
        />
        <mesh
          geometry={assets.caseback}
          position={[0, 0, bottom + 0.5]}
          scale={[radius / DIAL_RADIUS, radius / DIAL_RADIUS, 1]}
          material={metal}
          userData={CASEBACK}
        />
        {/* crown */}
        <mesh geometry={assets.crown} position={[outer - 2, 0, -6]} material={metal} />
        {children}
      </group>
      {/* lugs and strap: static, each a single merged mesh */}
      <mesh geometry={lugs} material={metal} />
      {[-1, 1].map((sy) => (
        <group key={sy} scale={[1, sy, 1]}>
          <mesh geometry={strap} material={strapMaterial} position={[0, outer + 6, -8]} />
        </group>
      ))}
    </group>
  )
}
