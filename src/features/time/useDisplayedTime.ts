import { useEffect, useState } from 'react'
import { useTimeStore } from '../../stores/timeStore'

/** Re-renders every animation frame with the displayed epoch time (for DOM/SVG views). */
export function useDisplayedTime(): number {
  const now = useTimeStore((s) => s.now)
  const [ms, setMs] = useState(now)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      setMs(now())
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [now])

  return ms
}
