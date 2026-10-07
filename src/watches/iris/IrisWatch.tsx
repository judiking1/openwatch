import { useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Color, type Group, type Mesh } from 'three'
import { useClockFrame, useDialTexture, useDisposable } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels, drawTicks, HOUR_LABELS } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import { dialPoint } from '../../utils/time'
import type { IrisAppearance } from './appearance'
import { BLADE_RADIUS, BLADES, bladeOutline, irisPose, ringRadius } from './iris'

const ARC = 24
const HOUR_RING = 93.5
/** Blades stack upward from here, one small step each. */
const BLADE_Z = 1.5
const BLADE_STEP = 0.22

/** Minute rings, labelled every five on their own ring along three spokes (white mask). */
function drawMinuteRings(ctx: CanvasRenderingContext2D) {
  const print = '#ffffff'
  ctx.save()
  ctx.strokeStyle = print
  ctx.fillStyle = print
  for (let m = 0; m < 60; m++) {
    const major = m % 5 === 0
    ctx.lineWidth = major ? 0.45 : 0.18
    ctx.globalAlpha = major ? 1 : 0.55
    ctx.beginPath()
    ctx.arc(0, 0, ringRadius(m), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.font = dialFont(700, 3.6)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const spoke of [0, 120, 240]) {
    for (let m = 0; m < 60; m += 5) {
      const p = dialPoint(ringRadius(m), spoke)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((spoke * Math.PI) / 180)
      ctx.fillText(String(m), 0, 0)
      ctx.restore()
    }
  }
  ctx.restore()
}

/** Hour numerals outside the blades (white mask). */
function drawHourRing(ctx: CanvasRenderingContext2D) {
  drawLabels(ctx, HOUR_LABELS, { radius: HOUR_RING, font: dialFont(700, 7), color: '#ffffff' })
  drawTicks(ctx, {
    count: 60,
    inner: 88,
    outer: 89.5,
    color: '#ffffff',
    width: 0.35,
    skip: (i) => i % 5 === 0,
  })
}

/** One blade: a circular segment rebuilt in place as the opening changes. */
function useBladeGeometry() {
  return useDisposable(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array((ARC + 1) * 3), 3))
    const index: number[] = []
    for (let i = 1; i < ARC; i++) index.push(0, i, i + 1)
    geometry.setIndex(index)
    return geometry
  }, [])
}

function Blade({ index, color, edge }: { index: number; color: string; edge: string }) {
  const geometry = useBladeGeometry()
  return (
    <group name={`blade-${index}`}>
      <mesh geometry={geometry} position-z={BLADE_Z + index * BLADE_STEP} castShadow>
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.42} side={2} />
      </mesh>
      {/* the straight edge: the only part that shows where blades overlap */}
      <mesh position-z={BLADE_Z + index * BLADE_STEP + 0.12}>
        <boxGeometry args={[1, 0.9, 0.2]} />
        <meshStandardMaterial color={edge} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Watch 012 — Iris: the opening of a nine-blade diaphragm is the minute. */
export function IrisWatch({ appearance }: { appearance: IrisAppearance }) {
  const carrier = useRef<Group>(null)
  const hourTip = useRef<Group>(null)
  const second = useRef<Group>(null)
  const scratch = useMemo(() => new Float32Array((ARC + 1) * 2), [])
  const rings = useDialTexture(DIAL_RADIUS, drawMinuteRings, [])
  const hours = useDialTexture(DIAL_RADIUS + 1, drawHourRing, [])

  // Neighbouring blades alternate slightly in tone so each one reads.
  const shades = useMemo(() => {
    const base = new Color(appearance.bladeColor)
    return Array.from(
      { length: BLADES },
      (_, i) =>
        `#${base
          .clone()
          .offsetHSL(0, 0, i % 2 ? 0.035 : -0.015)
          .getHexString()}`,
    )
  }, [appearance.bladeColor])

  useClockFrame((t) => {
    const pose = irisPose(t)
    const turn = dialRotationZ(pose.carrier)
    if (hourTip.current) hourTip.current.rotation.z = turn
    if (second.current) second.current.rotation.z = dialRotationZ(pose.second)
    const blades = carrier.current?.children ?? []
    blades.forEach((blade, i) => {
      // Blade 0's normal points at the hour; the others follow every 40°.
      const normal = Math.PI / 2 + turn + (i * 2 * Math.PI) / BLADES
      const [face, edge] = blade.children as Mesh[]
      const outline = bladeOutline(pose.aperture, normal, ARC, scratch)
      const position = face.geometry.getAttribute('position') as BufferAttribute
      for (let k = 0; k <= ARC; k++) position.setXYZ(k, outline[k * 2], outline[k * 2 + 1], 0)
      position.needsUpdate = true
      face.geometry.computeBoundingSphere()
      const chord = 2 * Math.sqrt(Math.max(0, BLADE_RADIUS ** 2 - pose.aperture ** 2))
      edge.position.x = (pose.aperture + 0.45) * Math.cos(normal)
      edge.position.y = (pose.aperture + 0.45) * Math.sin(normal)
      edge.rotation.z = normal + Math.PI / 2
      edge.scale.x = chord
    })
  })

  const top = BLADE_Z + BLADES * BLADE_STEP + 0.4
  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={appearance.dialColor} roughness={0.75} />
      </mesh>
      <PrintLayer mask={rings} color={appearance.ringColor} radius={DIAL_RADIUS} />
      <PrintLayer
        mask={hours}
        color={appearance.ringColor}
        radius={DIAL_RADIUS + 1}
        inner={BLADE_RADIUS}
        z={0.1}
      />

      <group ref={carrier} name="minute">
        {shades.map((shade, i) => (
          <Blade key={i} index={i} color={shade} edge={appearance.edgeColor} />
        ))}
      </group>

      {/* gold tip riding on blade 0, over every blade: the hour */}
      <group ref={hourTip} name="hour">
        <mesh position={[0, BLADE_RADIUS - 6, top]}>
          <coneGeometry args={[2.6, 9, 3]} />
          <meshStandardMaterial color={appearance.hourTipColor} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      <group ref={second} name="second">
        <mesh position={[0, 4, top]}>
          <boxGeometry args={[0.9, 8, 0.4]} />
          <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
        </mesh>
        <mesh position-z={top}>
          <cylinderGeometry args={[1.4, 1.4, 0.6, 20]} />
          <meshStandardMaterial color={appearance.secondColor} roughness={0.4} />
        </mesh>
      </group>

      <Crystal {...appearance} />
    </WatchCase>
  )
}
