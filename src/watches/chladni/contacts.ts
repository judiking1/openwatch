import { PLATE_RADIUS } from './plate'

/**
 * A neighbour grid for grain contacts: cells one grain diameter wide, each with a linked list
 * of the grains in it (`head` per cell, `next` per grain), rebuilt every step.
 */
export type Contacts = {
  radius: number
  size: number
  cell: number
  head: Int32Array
  next: Int32Array
}

export function createContacts(count: number, radius: number): Contacts {
  const cell = 2 * radius
  const size = Math.ceil((2 * PLATE_RADIUS) / cell) + 1
  return { radius, size, cell, head: new Int32Array(size * size), next: new Int32Array(count) }
}

function contactCell(c: Contacts, v: number) {
  return Math.min(c.size - 1, Math.max(0, Math.floor((v + PLATE_RADIUS) / c.cell)))
}

/**
 * Pushes overlapping grains apart (each moves half the overlap along the line between them).
 * One pass per step; overlaps left over are resolved over the next steps.
 */
export function collideGrains(grains: Float32Array, c: Contacts) {
  const { head, next, size } = c
  const count = grains.length / 2
  head.fill(-1)
  for (let i = 0; i < count; i++) {
    const k = contactCell(c, grains[i * 2 + 1]) * size + contactCell(c, grains[i * 2])
    next[i] = head[k]
    head[k] = i
  }
  const touch = 2 * c.radius
  for (let i = 0; i < count; i++) {
    const cx = contactCell(c, grains[i * 2])
    const cy = contactCell(c, grains[i * 2 + 1])
    for (let dy = -1; dy <= 1; dy++) {
      const yy = cy + dy
      if (yy < 0 || yy >= size) continue
      for (let dx = -1; dx <= 1; dx++) {
        const xx = cx + dx
        if (xx < 0 || xx >= size) continue
        for (let j = head[yy * size + xx]; j !== -1; j = next[j]) {
          if (j <= i) continue
          const ex = grains[j * 2] - grains[i * 2]
          const ey = grains[j * 2 + 1] - grains[i * 2 + 1]
          const d = Math.hypot(ex, ey)
          if (d >= touch) continue
          // Coincident grains: split along an arbitrary but fixed direction.
          const nx = d > 1e-6 ? ex / d : 1
          const ny = d > 1e-6 ? ey / d : 0
          const push = (touch - d) / 2
          grains[i * 2] -= nx * push
          grains[i * 2 + 1] -= ny * push
          grains[j * 2] += nx * push
          grains[j * 2 + 1] += ny * push
        }
      }
    }
  }
}

/** Grains scattered uniformly over the plate. */
