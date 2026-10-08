import { DIAL_RADIUS } from '../utils/dial'

/** Feature edges: faces meeting at more than this angle get a line (degrees). */
export const EDGE_ANGLE = 24

export const BLUEPRINT = {
  paper: '#0d2a4a',
  fill: '#123a63',
  line: '#9fd8ff',
  dimension: '#ffffff',
}

/**
 * Drawing scale for the callouts. The models are visual only (AGENTS.md): a case of
 * diameter 2 × (DIAL_RADIUS + 14) dial units is drawn as a 40 mm watch.
 */
export const CASE_DIAMETER_UNITS = 2 * (DIAL_RADIUS + 14)
export const MM_PER_UNIT = 40 / CASE_DIAMETER_UNITS

export function toMillimetres(units: number) {
  return Math.round(units * MM_PER_UNIT * 10) / 10
}

export function formatMm(units: number) {
  return `${toMillimetres(units).toFixed(1)} mm`
}
