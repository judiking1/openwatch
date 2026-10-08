import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type PlasmaAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    printColor: string
    electrodeColor: string
    filamentColor: string
    hourGlowColor: string
    minuteGlowColor: string
  }

export const defaultPlasmaAppearance: PlasmaAppearance = {
  caseColor: '#3a3d44',
  caseRoughness: 0.3,
  strapColor: '#141518',
  strapStyle: 'fabric',
  crystalTint: '#e9e4f5',
  crystalOpacity: 0.12,
  dialColor: '#0d0b14',
  printColor: '#8d87a3',
  electrodeColor: '#b8a27a',
  filamentColor: '#b56cff',
  hourGlowColor: '#ff7ad9',
  minuteGlowColor: '#7fe7ff',
}

export const plasmaFields: CustomizationField<PlasmaAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Chamber', group: 'Dial', control: { type: 'color' } },
  { key: 'printColor', label: 'Scales', group: 'Dial', control: { type: 'color' } },
  { key: 'electrodeColor', label: 'Electrodes', group: 'Dial', control: { type: 'color' } },
  { key: 'filamentColor', label: 'Filaments', group: 'Indicators', control: { type: 'color' } },
  { key: 'hourGlowColor', label: 'Hour phosphor', group: 'Indicators', control: { type: 'color' } },
  {
    key: 'minuteGlowColor',
    label: 'Minute phosphor',
    group: 'Indicators',
    control: { type: 'color' },
  },
]
