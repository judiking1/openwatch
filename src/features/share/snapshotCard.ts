import qrcode from 'qrcode-generator'

export const CARD = { width: 1080, height: 1350 }

/** QR modules for `text` (error correction M), as rows of dark/light. */
export function qrModules(text: string): boolean[][] {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)))
}

export type CardInfo = {
  number: string
  name: string
  tagline: string
  readingHint: string
  /** The time the watch shows, e.g. "10:08:37". */
  time: string
  link: string
}

const INK = '#e8e4da'
const DIM = '#9a978f'
const ACCENT = '#c9a96e'
const PAPER = '#0e0f13'

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
) {
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, y)
      y += lineHeight
      line = word
    } else line = next
  }
  if (line) ctx.fillText(line, x, y)
  return y + lineHeight
}

/**
 * A shareable card: the stage render (cropped to a square around the watch), number, name,
 * tagline, the time it shows with the reading hint, and a QR code of the share link.
 */
export function drawSnapshotCard(
  render: CanvasImageSource & { width: number; height: number },
  info: CardInfo,
) {
  const card = document.createElement('canvas')
  card.width = CARD.width
  card.height = CARD.height
  const ctx = card.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, CARD.width, CARD.height)

  // Square crop from the middle of the stage, where the watch sits.
  const side = Math.min(render.width, render.height)
  const sx = (render.width - side) / 2
  const sy = (render.height - side) / 2
  ctx.drawImage(render, sx, sy, side, side, 90, 60, 900, 900)

  const left = 90
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = ACCENT
  ctx.font = '600 28px Inter, system-ui, sans-serif'
  ctx.fillText(`No. ${info.number}`, left, 1010)
  ctx.fillStyle = INK
  ctx.font = '800 64px Inter, system-ui, sans-serif'
  ctx.fillText(info.name, left, 1080)
  ctx.font = '400 28px Inter, system-ui, sans-serif'
  ctx.fillStyle = DIM
  let y = wrap(ctx, info.tagline, left, 1124, 640, 36)
  ctx.fillStyle = INK
  ctx.font = '600 26px Inter, system-ui, sans-serif'
  y = wrap(ctx, `Shows ${info.time} — ${info.readingHint}`, left, y + 8, 640, 34)

  // QR code of the link, bottom right.
  const modules = qrModules(info.link)
  const size = 220
  const cell = size / (modules.length + 8)
  const qx = CARD.width - left - size
  const qy = CARD.height - 70 - size
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(qx, qy, size, size)
  ctx.fillStyle = '#000000'
  modules.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark)
        ctx.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, Math.ceil(cell), Math.ceil(cell))
    }),
  )
  ctx.fillStyle = DIM
  ctx.font = '500 20px Inter, system-ui, sans-serif'
  ctx.fillText('Orbital Watch Lab · a visual model, not a product', left, CARD.height - 70)
  return card
}
