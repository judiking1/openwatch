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

/** A clock time from its parts (handy in tests and fixed scenes). */
export function clockTime(hours: number, minutes = 0, seconds = 0, milliseconds = 0): ClockTime {
  return { hours, minutes, seconds, milliseconds }
}

/** Shortest distance between two dial angles, degrees (0..180). */
export function angleDistance(a: number, b: number): number {
  return Math.abs(((((a - b + 540) % 360) + 360) % 360) - 180)
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

/**
 * Jumping-hour angle: stays on the whole hour for the full hour, then steps to the
 * next one, easing over `jumpMs` right after the hour so the change is visible.
 */
export function jumpHourAngle(t: ClockTime, jumpMs = 600): number {
  const msIntoHour = ((t.minutes * 60 + t.seconds) * 1000 + t.milliseconds) % 3_600_000
  const p = Math.min(1, msIntoHour / jumpMs)
  const eased = p * p * (3 - 2 * p)
  return ((t.hours % 12) - 1 + eased) * 30
}

/** Parses "H:MM" or "HH:MM:SS"; returns null when out of range or malformed. */
export function parseClock(
  value: string,
): { hours: number; minutes: number; seconds: number } | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim())
  if (!m) return null
  const [hours, minutes, seconds] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)]
  if (hours > 23 || minutes > 59 || seconds > 59) return null
  return { hours, minutes, seconds }
}

/** Epoch ms on the same local day as `baseMs`, at the given time of day. */
export function atTimeOfDay(baseMs: number, hours: number, minutes: number, seconds = 0): number {
  const d = new Date(baseMs)
  d.setHours(hours, minutes, seconds, 0)
  return d.getTime()
}

export function secondsOfDay(t: ClockTime): number {
  return t.hours * 3600 + t.minutes * 60 + t.seconds
}

/** Smallest signed difference a − b in degrees, in (−180, 180]. */
export function angleDelta(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360
  return d > 180 ? d - 360 : d
}
