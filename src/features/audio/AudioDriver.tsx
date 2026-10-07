import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Quaternion, Vector3, type Group } from 'three'
import { useStageStore } from '../../stores/stageStore'
import { useTimeStore } from '../../stores/timeStore'
import { watchAudio } from './engine'
import type { SoundProfile } from '../../types/watch'
import { listenerGain, soundEvents } from './schedule'

const toCamera = new Vector3()
const axis = new Vector3()
const orientation = new Quaternion()

/**
 * Voices the concept's sound profile from the watch's own clock, and sets the loudness from
 * the camera: closer is louder, and the caseback side is louder than the crystal side.
 */
export function AudioDriver({
  profile,
  root,
}: {
  profile: SoundProfile
  root: RefObject<Group | null>
}) {
  const last = useRef<number | null>(null)
  useFrame(({ camera }) => {
    const now = useTimeStore.getState().now()
    const previous = last.current
    last.current = now
    if (!useStageStore.getState().sound || !watchAudio.running) return

    const model = root.current
    if (model) {
      model.getWorldPosition(toCamera)
      toCamera.subVectors(camera.position, toCamera)
      axis.set(0, 0, 1).applyQuaternion(model.getWorldQuaternion(orientation))
      watchAudio.setGain(listenerGain(toCamera.length(), toCamera.dot(axis) < 0))
    }
    if (previous === null) return
    const span = now - previous
    for (const event of soundEvents(profile, previous, now)) {
      // Spread a frame's events over the next frame in wall-clock time.
      const delay = span > 0 ? ((event.at - previous) / span) * 0.016 : 0
      watchAudio.play(profile, event.accent, delay)
    }
  })
  return null
}
