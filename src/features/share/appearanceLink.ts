import type { Appearance, CustomizationField } from '../../types/watch'

/**
 * Appearance in a share link (`?a=`): only the fields that differ from the concept's
 * defaults, as `index-value` pairs joined by `_`, e.g. `0-c9a96e_3-0.25_7-1`.
 *
 * - colour → 6 hex digits, range → number (clamped on decode), select → option index.
 * - The index is the field's position in `customization`; links stay valid as long as fields
 *   are only appended. Anything malformed is ignored, so a link can never inject odd values.
 */
export function encodeAppearance(
  fields: CustomizationField[],
  defaults: Appearance,
  appearance: Appearance,
): string {
  const pairs: string[] = []
  fields.forEach((field, i) => {
    const value = appearance[field.key]
    if (value === defaults[field.key] || value === undefined) return
    const { control } = field
    let encoded: string | null = null
    if (control.type === 'color') encoded = String(value).replace('#', '').toLowerCase()
    if (control.type === 'range') encoded = String(Number(Number(value).toFixed(3)))
    if (control.type === 'select') {
      const index = control.options.findIndex((o) => o.value === value)
      encoded = index >= 0 ? String(index) : null
    }
    if (encoded !== null) pairs.push(`${i.toString(36)}-${encoded}`)
  })
  return pairs.join('_')
}

export function decodeAppearance(fields: CustomizationField[], code: string): Partial<Appearance> {
  const result: Partial<Appearance> = {}
  for (const pair of code.split('_')) {
    const dash = pair.indexOf('-')
    if (dash < 1) continue
    const field = fields[parseInt(pair.slice(0, dash), 36)]
    const raw = pair.slice(dash + 1)
    if (!field) continue
    const { control } = field
    if (control.type === 'color' && /^[0-9a-f]{6}$/i.test(raw)) {
      result[field.key] = `#${raw.toLowerCase()}`
    } else if (control.type === 'range') {
      const n = Number(raw)
      if (raw !== '' && Number.isFinite(n)) {
        result[field.key] = Math.min(control.max, Math.max(control.min, n))
      }
    } else if (control.type === 'select' && /^\d+$/.test(raw)) {
      const option = control.options[Number(raw)]
      if (option) result[field.key] = option.value
    }
  }
  return result
}

/** A link to a watch with its appearance and, when the clock is frozen, its time. */
export function shareLink(base: string, conceptId: string, code: string, frozenAt?: string) {
  const params = new URLSearchParams()
  if (code) params.set('a', code)
  if (frozenAt) params.set('t', frozenAt)
  const query = params.toString()
  return `${base}#/watch/${conceptId}${query ? `?${query}` : ''}`
}
