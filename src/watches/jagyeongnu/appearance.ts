import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type JagyeongnuAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    printColor: string
    waterDeep: string
    waterShallow: string
    plaqueColor: string
  }

export const defaultJagyeongnuAppearance: JagyeongnuAppearance = {
  caseColor: '#3f3a33',
  caseRoughness: 0.45,
  strapColor: '#4a2f1d',
  strapStyle: 'leather',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.08,
  dialColor: '#1c1712',
  printColor: '#d9c39a',
  waterDeep: '#0c3b5e',
  waterShallow: '#3fa4d8',
  plaqueColor: '#7a1f1a',
}

export const jagyeongnuFields: CustomizationField<JagyeongnuAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'printColor', label: 'Print', group: 'Dial', control: { type: 'color' } },
  { key: 'plaqueColor', label: '시진 plaque', group: 'Dial', control: { type: 'color' } },
  { key: 'waterDeep', label: 'Water (deep)', group: 'Indicators', control: { type: 'color' } },
  {
    key: 'waterShallow',
    label: 'Water (surface)',
    group: 'Indicators',
    control: { type: 'color' },
  },
]
