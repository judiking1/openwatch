import { describe, expect, it } from 'vitest'
import { resolveAppearance } from './appearanceStore'

describe('resolveAppearance', () => {
  const defaults = { caseColor: '#fff', caseRoughness: 0.3 }

  it('returns defaults without overrides', () => {
    expect(resolveAppearance(defaults, undefined)).toBe(defaults)
  })

  it('applies known overrides and drops stale or mistyped keys', () => {
    expect(
      resolveAppearance(defaults, { caseColor: '#000', gone: 'x', caseRoughness: 'bad' }),
    ).toEqual({ caseColor: '#000', caseRoughness: 0.3 })
  })
})
