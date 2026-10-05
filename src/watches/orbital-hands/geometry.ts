import { indicatorScale, type IndicatorKind, type OrbitalHandsLayout } from './config'

export function orbitRadius(layout: OrbitalHandsLayout, kind: IndicatorKind): number {
  switch (kind) {
    case 'hour':
      return layout.hourOrbitRadius
    case 'minute':
      return layout.minuteOrbitRadius
    case 'second':
      return layout.secondOrbitRadius
  }
}

export function indicatorSize(layout: OrbitalHandsLayout, kind: IndicatorKind) {
  const s = indicatorScale[kind]
  return { length: layout.indicatorLength * s.length, width: layout.indicatorWidth * s.width }
}

/**
 * Indicator outline drawn at 12 o'clock in y-down dial space: the base sits on
 * the orbit and the tip points toward the centre. Rotate by the hand angle to place it.
 */
export function indicatorOutline(
  radius: number,
  length: number,
  width: number,
): Array<[number, number]> {
  const base = -radius
  const tip = -(radius - length)
  const half = width / 2
  return [
    [-half, base],
    [half, base],
    [half * 0.35, tip],
    [-half * 0.35, tip],
  ]
}
