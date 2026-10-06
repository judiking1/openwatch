import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type LensAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    hourColor: string
    minuteColor: string
    secondColor: string
  }

export const defaultLensAppearance: LensAppearance = {
  caseColor: '#2c2e33',
  caseRoughness: 0.35,
  strapColor: '#d9d4c7',
  strapStyle: 'fabric',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  dialColor: '#f3f0e8',
  hourColor: '#16181d',
  minuteColor: '#3b6fd8',
  secondColor: '#e0533d',
}

export const lensFields: CustomizationField<LensAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'hourColor', label: 'Hour numerals', group: 'Indicators', control: { type: 'color' } },
  { key: 'minuteColor', label: 'Minute wave', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Seconds ripple', group: 'Indicators', control: { type: 'color' } },
]
