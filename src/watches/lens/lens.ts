import { angleDelta } from '../../utils/time'

/** How strongly the "lens" swells a mark, 0..1, by its angular distance from the focus. */
export function swell(markAngle: number, focus: number, width: number): number {
  const d = angleDelta(markAngle, focus) / width
  return Math.exp(-d * d)
}

export const LENS = {
  hour: { width: 14, min: 0.45, max: 1.9 },
  minute: { width: 6, min: 1, max: 5.5 },
  minuteLabel: { width: 9, min: 0.6, max: 1.5 },
  second: { width: 9, min: 0.5, max: 2.6 },
} as const

export function lensScale(kind: keyof typeof LENS, markAngle: number, focus: number): number {
  const l = LENS[kind]
  return l.min + (l.max - l.min) * swell(markAngle, focus, l.width)
}
