/** Super-LumiNova-like afterglow colour (green-blue, as C3 / BGW9 pigments read at night). */
export const LUME_COLOR = '#9cf5cf'

/** Emissive intensity of luminous parts at full night. */
export const LUME_INTENSITY = 1.6

/** Light and environment fall to this fraction of their studio level at full night. */
export const NIGHT_LIGHT = 0.03

/** Scale for studio lights at night factor `n` (0 = studio, 1 = full night). */
export function lightScale(n: number) {
  return 1 - (1 - NIGHT_LIGHT) * n
}

/** Bloom tuned for lume: the glow sits far below the lasers' HDR level. */
export const LUME_BLOOM = { strength: 0.9, radius: 0.45, threshold: 0.3 }

const HANDS = new Set(['hour', 'minute', 'second'])

/** Luminous parts: tagged prints, and everything inside the conventionally named hands. */
export function isLuminous(
  object: { userData: { lume?: boolean }; name: string; parent: unknown },
  ancestorNames: (o: unknown) => string[],
) {
  if (object.userData.lume) return true
  return ancestorNames(object).some((name) => HANDS.has(name))
}
