import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type ShearsAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    numeralColor: string
    scaleColor: string
    bladeColor: string
    hourTipColor: string
    secondColor: string
  }

export const defaultShearsAppearance: ShearsAppearance = {
  caseColor: '#d9dadf',
  caseRoughness: 0.18,
  strapColor: '#1f2a36',
  strapStyle: 'fabric',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  dialColor: '#e9e5dc',
  numeralColor: '#1d1f24',
  scaleColor: '#5a6270',
  bladeColor: '#2b2e35',
  hourTipColor: '#c9a96e',
  secondColor: '#d8452f',
}

export const shearsFields: CustomizationField<ShearsAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'numeralColor', label: 'Hour numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'scaleColor', label: 'Minute scale', group: 'Dial', control: { type: 'color' } },
  { key: 'bladeColor', label: 'Blades', group: 'Indicators', control: { type: 'color' } },
  { key: 'hourTipColor', label: 'Hour tip', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Seconds bead', group: 'Indicators', control: { type: 'color' } },
]
