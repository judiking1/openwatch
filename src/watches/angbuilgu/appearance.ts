import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type AngbuilguAppearance = CaseAppearance &
  CrystalAppearance & {
    bowlColor: string
    lineColor: string
    shadowColor: string
    rimColor: string
    sunColor: string
  }

export const defaultAngbuilguAppearance: AngbuilguAppearance = {
  caseColor: '#8a6a3b',
  caseRoughness: 0.4,
  strapColor: '#3a2a1c',
  strapStyle: 'leather',
  crystalTint: '#fff4e0',
  crystalOpacity: 0.08,
  bowlColor: '#c9a46a',
  lineColor: '#4a3418',
  shadowColor: '#120c06',
  rimColor: '#5b4325',
  sunColor: '#ffcf6b',
}

export const angbuilguFields: CustomizationField<AngbuilguAppearance>[] = [
  ...caseFields,
  { key: 'bowlColor', label: 'Bowl (시반)', group: 'Dial', control: { type: 'color' } },
  { key: 'lineColor', label: 'Engraved lines', group: 'Dial', control: { type: 'color' } },
  { key: 'rimColor', label: 'Rim', group: 'Dial', control: { type: 'color' } },
  { key: 'shadowColor', label: 'Shadow', group: 'Indicators', control: { type: 'color' } },
  { key: 'sunColor', label: 'Sun / moon bead', group: 'Indicators', control: { type: 'color' } },
]
