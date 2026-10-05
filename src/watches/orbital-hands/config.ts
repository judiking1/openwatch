/** Layout parameters of the Orbital Hands dial, in dial units (dial radius = 100). */
export type OrbitalHandsLayout = {
  numeralRadius: number
  hourOrbitRadius: number
  minuteOrbitRadius: number
  secondOrbitRadius: number
  indicatorLength: number
  indicatorWidth: number
}

export const defaultOrbitalHandsLayout: OrbitalHandsLayout = {
  numeralRadius: 34,
  hourOrbitRadius: 62,
  minuteOrbitRadius: 76,
  secondOrbitRadius: 90,
  indicatorLength: 14,
  indicatorWidth: 5,
}

export type IndicatorKind = 'hour' | 'minute' | 'second'

/** Per-indicator proportions relative to the base length/width. */
export const indicatorScale: Record<IndicatorKind, { length: number; width: number }> = {
  hour: { length: 1.1, width: 1.6 },
  minute: { length: 1, width: 1 },
  second: { length: 0.8, width: 0.45 },
}
