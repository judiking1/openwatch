import type { CustomizationField } from '../../types/watch'
import { caseFields } from '../../three/parts/fields'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CrystalAppearance } from '../../three/parts/Crystal'

export type NumeralRingAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    hourRingColor: string
    minuteRingColor: string
    beamColor: string
    secondColor: string
  }

export const defaultNumeralRingAppearance: NumeralRingAppearance = {
  caseColor: '#2a2b30',
  caseRoughness: 0.45,
  strapColor: '#1c1d22',
  strapStyle: 'fabric',
  crystalTint: '#dfe8f0',
  crystalOpacity: 0.1,
  dialColor: '#0d0e12',
  hourRingColor: '#f1ede2',
  minuteRingColor: '#9a968c',
  beamColor: '#7fd1c7',
  secondColor: '#e0533d',
}

export const numeralRingFields: CustomizationField<NumeralRingAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'hourRingColor', label: 'Hour numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'minuteRingColor', label: 'Minute numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'beamColor', label: 'Beam', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Seconds dot', group: 'Indicators', control: { type: 'color' } },
]
