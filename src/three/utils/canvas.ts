import { degToRad, dialPoint } from '../../utils/time'

/** Canvas font shorthand used by every dial. */
export function dialFont(weight: number, size: number): string {
  return `${weight} ${size}px Inter, system-ui, sans-serif`
}

export function fillDisc(ctx: CanvasRenderingContext2D, color: string, radius: number) {
  ctx.fillStyle = color
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
}

export type TickSpec = {
  count: number
  inner: number
  outer: number
  color: string
  width?: number
  /** Every n-th tick is major (longer and thicker). */
  majorEvery?: number
  majorInner?: number
  majorOuter?: number
  majorWidth?: number
  alpha?: number
  majorAlpha?: number
  /** Skip a tick (e.g. where a numeral is printed). */
  skip?: (index: number) => boolean
  /** Dial angle of tick i; defaults to an even division of the circle. */
  angleOf?: (index: number) => number
}

/** Radial tick marks in dial coordinates (canvas y-down, angles clockwise from 12). */
export function drawTicks(ctx: CanvasRenderingContext2D, spec: TickSpec) {
  const {
    count,
    inner,
    outer,
    color,
    width = 0.5,
    majorEvery = 0,
    majorInner = inner,
    majorOuter = outer,
    majorWidth = width,
    alpha = 1,
    majorAlpha = alpha,
    skip,
    angleOf = (i) => (360 / count) * i,
  } = spec
  ctx.save()
  ctx.strokeStyle = color
  for (let i = 0; i < count; i++) {
    if (skip?.(i)) continue
    const major = majorEvery > 0 && i % majorEvery === 0
    const angle = angleOf(i)
    const a = dialPoint(major ? majorInner : inner, angle)
    const b = dialPoint(major ? majorOuter : outer, angle)
    ctx.globalAlpha = major ? majorAlpha : alpha
    ctx.lineWidth = major ? majorWidth : width
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()
}

export type LabelSpec = {
  radius: number
  font: string
  color: string
  /** Rotate each label so it reads upright when its position is at 12 o'clock. */
  tangential?: boolean
  angleOf?: (index: number) => number
}

/** Labels spaced evenly around the dial (or at `angleOf`). */
export function drawLabels(ctx: CanvasRenderingContext2D, labels: string[], spec: LabelSpec) {
  const {
    radius,
    font,
    color,
    tangential = false,
    angleOf = (i) => (360 / labels.length) * i,
  } = spec
  ctx.save()
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  labels.forEach((label, i) => {
    const angle = angleOf(i)
    const p = dialPoint(radius, angle)
    if (tangential) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(degToRad(angle))
      ctx.fillText(label, 0, 0)
      ctx.restore()
    } else {
      ctx.fillText(label, p.x, p.y)
    }
  })
  ctx.restore()
}

/** "12", "1", … "11" — hour numerals in dial order starting at 12 o'clock. */
export const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i))

/** "00", "05", … "55". */
export const FIVE_MINUTE_LABELS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
)

/** A single centred label on a transparent canvas, `size` px square. */
export function createLabelCanvas(text: string, font: string, color: string, size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2)
  return canvas
}
