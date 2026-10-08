import type { ClockTime } from '../../utils/time'
import type { ConceptSpec, EncodingVariable } from '../../../scripts/conceptScaffold.mjs'

export type Unit = 'hour' | 'minute' | 'second'

/** The primitive that sketches one encoding in the lab preview. */
export type SketchKind = 'hand' | 'pair' | 'ring' | 'bead' | 'dots'

export type SketchIndicator = {
  unit: Unit
  kind: SketchKind
  /** Inner and outer radius of the unit's band on the dial (dial units). */
  band: [number, number]
  element: string
}

const BANDS: Record<Unit, [number, number]> = {
  hour: [14, 42],
  minute: [46, 74],
  second: [78, 92],
}

const KIND: Record<EncodingVariable, SketchKind> = {
  angle: 'hand',
  'relative angle': 'pair',
  radius: 'ring',
  size: 'ring',
  position: 'bead',
  count: 'dots',
  alignment: 'hand',
  colour: 'hand',
  shape: 'hand',
  other: 'hand',
}

/** One sketch primitive per encoded unit. */
export function sketchIndicators(spec: Pick<ConceptSpec, 'encoding'>): SketchIndicator[] {
  return (['hour', 'minute', 'second'] as const).flatMap((unit) => {
    const e = spec.encoding[unit]
    return e
      ? [{ unit, kind: KIND[e.variable] ?? 'hand', band: BANDS[unit], element: e.element }]
      : []
  })
}

/** 0..1 through each unit's cycle (12 h, 60 min, 60 s), continuous. */
export function unitFraction(unit: Unit, t: ClockTime) {
  const seconds = t.seconds + t.milliseconds / 1000
  const minutes = t.minutes + seconds / 60
  if (unit === 'second') return seconds / 60
  if (unit === 'minute') return minutes / 60
  return ((t.hours % 12) + minutes / 60) / 12
}

/** How many dots a count encoding shows: hours 1–12, minutes in tens 0–5, seconds in tens. */
export function dotCount(unit: Unit, t: ClockTime) {
  if (unit === 'hour') return t.hours % 12 || 12
  return Math.floor((unit === 'minute' ? t.minutes : t.seconds) / 10)
}
