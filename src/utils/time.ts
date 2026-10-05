/** Angles in degrees, measured clockwise from 12 o'clock. */
export type HandAngles = {
  hour: number
  minute: number
  second: number
}

export type ClockTime = {
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export function clockTimeFromMs(epochMs: number): ClockTime {
  const d = new Date(epochMs)
  return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    milliseconds: d.getMilliseconds(),
  }
}

/**
 * Continuous (sweeping) angles for a 12-hour dial.
 * Each hand includes the fractional progress of the smaller units.
 */
export function handAngles(t: ClockTime): HandAngles {
  const second = t.seconds + t.milliseconds / 1000
  const minute = t.minutes + second / 60
  const hour = (t.hours % 12) + minute / 60
  return {
    hour: hour * 30,
    minute: minute * 6,
    second: second * 6,
  }
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Point on a circle for a dial angle (clockwise from 12 o'clock) in a y-down
 * coordinate system such as SVG.
 */
export function dialPoint(radius: number, angleDeg: number): { x: number; y: number } {
  const a = degToRad(angleDeg)
  return { x: radius * Math.sin(a), y: -radius * Math.cos(a) }
}

export function formatClock(t: ClockTime): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)}`
}
