import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Color, type Group, type Light, type Material, type Object3D } from 'three'
import { useStageStore } from '../../stores/stageStore'
import { approach } from './explode'
import { isLuminous, lightScale, LUME_COLOR, LUME_INTENSITY } from './lume'

type Glowable = Material & {
  emissive?: Color
  emissiveIntensity?: number
  userData: { lumeBase?: { color: Color; intensity: number } }
}
type Lit = Light & { userData: { lumeBase?: number } }

const lume = new Color(LUME_COLOR)

const ancestorNames = (o: unknown) => {
  const names: string[] = []
  for (let p = o as Object3D | null; p; p = p.parent) names.push(p.name)
  return names
}

/**
 * Night view: eases a night factor toward the toolbar toggle, scales every light and the
 * environment down to a faint floor, and blends luminous parts' emission toward lume green
 * (parts that already glow by design keep their own emission).
 * Original intensities and colours are remembered on first contact and restored by day.
 */
export function LumeController({ root }: { root: RefObject<Group | null> }) {
  const night = useRef(0)
  useFrame((state, dt) => {
    const target = useStageStore.getState().lume ? 1 : 0
    const previous = night.current
    let n = approach(previous, target, Math.min(dt, 0.1), 4)
    if (target === 0 && n < 1e-3) n = 0
    night.current = n
    if (n === 0 && previous === 0) return

    const scale = lightScale(n)
    state.scene.environmentIntensity = scale
    state.scene.traverse((object) => {
      const light = object as Lit
      if (!light.isLight) return
      light.userData.lumeBase ??= light.intensity
      light.intensity = light.userData.lumeBase * scale
    })

    root.current?.traverse((object) => {
      const material = (object as { material?: Material | Material[] }).material
      if (!material || !isLuminous(object, ancestorNames)) return
      for (const m of [material].flat() as Glowable[]) {
        if (!m.emissive) continue
        m.userData.lumeBase ??= { color: m.emissive.clone(), intensity: m.emissiveIntensity ?? 0 }
        const base = m.userData.lumeBase
        // Already luminous by design (e.g. Eclipse's glow face): keep its own emission.
        if (base.intensity > 0) continue
        m.emissive.copy(base.color).lerp(lume, n)
        m.emissiveIntensity = base.intensity + (LUME_INTENSITY - base.intensity) * n
      }
    })
  })
  return null
}
