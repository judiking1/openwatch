import { degToRad } from '../../utils/time'

/** Hanyang (Seoul), where the original 앙부일구 was calibrated. */
export const LATITUDE = 37.57
const OBLIQUITY = 23.44

/** Horizon coordinates: x = east, y = north, z = up (zenith). Unit length. */
export type Vec3 = { x: number; y: number; z: number }

export function dayOfYear(ms: number): number {
  const d = new Date(ms)
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000)
}

/** Sun's ecliptic longitude in degrees (0 = spring equinox), simple mean-sun model. */
export function solarLongitude(day: number): number {
  return ((((360 * (day - 80)) / 365.2422) % 360) + 360) % 360
}

export function declinationFromLongitude(longitudeDeg: number): number {
  const s = Math.sin(degToRad(OBLIQUITY)) * Math.sin(degToRad(longitudeDeg))
  return (Math.asin(s) * 180) / Math.PI
}

/**
 * Sun direction for a solar time (hours, 12 = noon) and declination.
 * Hour angle H is positive in the afternoon (sun in the west).
 */
export function sunVector(
  solarHours: number,
  declinationDeg: number,
  latitudeDeg = LATITUDE,
): Vec3 {
  const H = degToRad((solarHours - 12) * 15)
  const d = degToRad(declinationDeg)
  const p = degToRad(latitudeDeg)
  return {
    x: -Math.cos(d) * Math.sin(H),
    y: Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.cos(H) * Math.sin(p),
    z: Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H),
  }
}

/** Unit vector along the gnomon: the celestial pole, due north at an altitude = latitude. */
export function poleVector(latitudeDeg = LATITUDE): Vec3 {
  const p = degToRad(latitudeDeg)
  return { x: 0, y: Math.cos(p), z: Math.sin(p) }
}

/**
 * Where the shadow of point `q` (inside the bowl's sphere of radius R, centred at the
 * origin) falls on the sphere, for light arriving along −sun. With the gnomon tip at the
 * centre this is simply −R·sun: the defining property of the 앙부일구.
 */
export function shadowOnSphere(
  q: Vec3,
  sun: Vec3,
  R: number,
  out: Vec3 = { x: 0, y: 0, z: 0 },
): Vec3 {
  const b = q.x * sun.x + q.y * sun.y + q.z * sun.z
  const c = q.x * q.x + q.y * q.y + q.z * q.z - R * R
  const t = b + Math.sqrt(b * b - c)
  out.x = q.x - t * sun.x
  out.y = q.y - t * sun.y
  out.z = q.z - t * sun.z
  return out
}

/** The twelve 시진 (double hours) starting with 자시 at 23:00. */
export const SIJIN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
export const SIJIN_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** Clock hours a 시진 spans: 0 = 자시 → 23–1, 5 = 사시 → 9–11. */
export function sijinHours(index: number): { start: number; end: number } {
  return { start: (index * 2 + 23) % 24, end: (index * 2 + 1) % 24 }
}

/** e.g. 5 → '09–11' (사시). */
export function sijinRange(index: number): string {
  const { start, end } = sijinHours(index)
  const pad = (h: number) => String(h).padStart(2, '0')
  return `${pad(start)}–${pad(end)}`
}

/** e.g. 7:45 → 진시 초 (辰初). */
export function sijin(hours: number): { index: number; half: '초' | '정' } {
  const shifted = (hours + 1) % 24
  return { index: Math.floor(shifted / 2), half: shifted % 2 < 1 ? '초' : '정' }
}

/** 24 solar terms starting at the spring equinox (ecliptic longitude 0°). */
export const SOLAR_TERMS = [
  '춘분',
  '청명',
  '곡우',
  '입하',
  '소만',
  '망종',
  '하지',
  '소서',
  '대서',
  '입추',
  '처서',
  '백로',
  '추분',
  '한로',
  '상강',
  '입동',
  '소설',
  '대설',
  '동지',
  '소한',
  '대한',
  '입춘',
  '우수',
  '경칩',
]

export function solarTerm(longitudeDeg: number): string {
  return SOLAR_TERMS[Math.floor(longitudeDeg / 15) % 24]
}

/** Night watches (경): 19:00–05:00 split into five two-hour watches. */
export function nightWatch(hours: number): { watch: number; fraction: number } | null {
  const sinceDusk = (hours - 19 + 24) % 24
  if (sinceDusk >= 10) return null
  return { watch: Math.floor(sinceDusk / 2) + 1, fraction: sinceDusk / 10 }
}
