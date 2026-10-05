import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CrystalAppearance } from '../../three/parts/Crystal'

export type EclipseAppearance = CaseAppearance &
  CrystalAppearance & {
    glowColor: string
    markerColor: string
    discColor: string
    moonColor: string
  }

export const defaultEclipseAppearance: EclipseAppearance = {
  caseColor: '#c8a46a',
  caseRoughness: 0.22,
  strapColor: '#3b2a1e',
  strapStyle: 'leather',
  crystalTint: '#fff4e0',
  crystalOpacity: 0.1,
  glowColor: '#ffb45a',
  markerColor: '#2a1608',
  discColor: '#121114',
  moonColor: '#1b1a1f',
}
