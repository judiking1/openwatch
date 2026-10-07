import { describe, expect, it } from 'vitest'
import { getConcept } from '../../watches/registry'
import { decodeAppearance, encodeAppearance, shareLink } from './appearanceLink'

const concept = getConcept('shears')!
const { customization: fields, defaultAppearance: defaults } = concept

describe('appearance links', () => {
  it('encodes only what differs from the defaults and decodes it back', () => {
    const appearance = {
      ...defaults,
      caseColor: '#C9A96E',
      caseRoughness: 0.42,
      strapStyle: 'metal',
    }
    const code = encodeAppearance(fields, defaults, appearance)
    expect(code.split('_')).toHaveLength(3)
    expect(encodeAppearance(fields, defaults, defaults)).toBe('')
    expect(decodeAppearance(fields, code)).toEqual({
      caseColor: '#c9a96e',
      caseRoughness: 0.42,
      strapStyle: 'metal',
    })
  })

  it('ignores malformed pairs and clamps ranges', () => {
    const roughness = fields.findIndex((f) => f.key === 'caseRoughness').toString(36)
    const colour = fields.findIndex((f) => f.key === 'caseColor').toString(36)
    const decoded = decodeAppearance(
      fields,
      `${roughness}-9_${colour}-zzzzzz_zz-123456_-1_${colour}-<script>_x`,
    )
    expect(decoded).toEqual({ caseRoughness: 0.8 })
  })

  it('builds a link with the appearance and an optional frozen time', () => {
    expect(shareLink('https://x.dev/owl/', 'iris', '0-ffffff', '10:10:00')).toBe(
      'https://x.dev/owl/#/watch/iris?a=0-ffffff&t=10%3A10%3A00',
    )
    expect(shareLink('https://x.dev/', 'iris', '')).toBe('https://x.dev/#/watch/iris')
  })
})
