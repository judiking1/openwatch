import { describe, expect, it } from 'vitest'
import { clockTime as t } from '../../utils/time'
import { onHead, turntablePose } from './turntable'

describe('turntable', () => {
  it('puts the current hour numeral under the index at twelve', () => {
    for (const h of [1, 3, 7, 11]) {
      expect(onHead(h * 30, turntablePose(t(h, 30, 5)).head)).toBe(0)
    }
    expect(onHead(0, turntablePose(t(12, 10, 5)).head)).toBe(0)
  })

  it('keeps the hour for the whole hour', () => {
    expect(turntablePose(t(7, 59, 59)).head).toBe(turntablePose(t(7, 0, 1)).head)
  })

  it('runs the minute hand normally relative to the head', () => {
    const p = turntablePose(t(7, 45))
    expect(p.minute).toBe(270)
    // The hand and the dial's "45" mark coincide wherever the head is.
    expect(onHead(p.minute, p.head)).toBe(onHead(45 * 6, p.head))
  })
})
