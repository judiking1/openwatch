/** Tone mapping names selectable with `?tone=` (kept free of three.js imports). */
export const TONE_MAPPING_NAMES = ['aces', 'agx', 'neutral'] as const
export type ToneMappingName = (typeof TONE_MAPPING_NAMES)[number]

export function parseToneMapping(value: string | null): ToneMappingName | undefined {
  return TONE_MAPPING_NAMES.find((name) => name === value)
}
