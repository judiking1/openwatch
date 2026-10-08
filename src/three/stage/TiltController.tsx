import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3, type Group } from 'three'
import { useStageStore } from '../../stores/stageStore'
import { approach } from './explode'
import { tilt, tiltFromDevice, tiltFromView } from './tilt'

const toCamera = new Vector3()
const centre = new Vector3()

/**
 * Keeps `tilt` up to date: from the phone's orientation when the visitor enabled it, else
 * from the viewing direction (orbiting the watch tilts it). Eased so parts do not jerk.
 */
export function TiltController({ root }: { root: RefObject<Group | null> }) {
  const device = useStageStore((s) => s.deviceTilt)
  const reading = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!device) return
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) reading.current = tiltFromDevice(e.beta, e.gamma)
    }
    window.addEventListener('deviceorientation', onOrientation)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      reading.current = null
    }
  }, [device])

  useFrame(({ camera }, dt) => {
    let target = reading.current
    if (!target) {
      root.current?.getWorldPosition(centre)
      toCamera.subVectors(camera.position, centre).normalize()
      target = tiltFromView(toCamera)
    }
    const step = Math.min(dt, 0.1)
    tilt.x = approach(tilt.x, target.x, step, 6)
    tilt.y = approach(tilt.y, target.y, step, 6)
  })
  return null
}
