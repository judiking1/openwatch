import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type OpticalLeverAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    printColor: string
    hourBeam: string
    minuteBeam: string
    secondBeam: string
  }

export const defaultOpticalLeverAppearance: OpticalLeverAppearance = {
  caseColor: '#2a2c31',
  caseRoughness: 0.3,
  strapColor: '#101114',
  strapStyle: 'fabric',
  crystalTint: '#c9d6ff',
  crystalOpacity: 0.12,
  dialColor: '#07080b',
  printColor: '#8b8f99',
  hourBeam: '#ff3b30',
  minuteBeam: '#32ff7e',
  secondBeam: '#a970ff',
}

export const opticalLeverFields: CustomizationField<OpticalLeverAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'printColor', label: 'Print', group: 'Dial', control: { type: 'color' } },
  { key: 'hourBeam', label: 'Hour beam', group: 'Indicators', control: { type: 'color' } },
  { key: 'minuteBeam', label: 'Minute beam', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondBeam', label: 'Second beam', group: 'Indicators', control: { type: 'color' } },
]
