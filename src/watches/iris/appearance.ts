import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type IrisAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    ringColor: string
    bladeColor: string
    edgeColor: string
    hourTipColor: string
    secondColor: string
  }

export const defaultIrisAppearance: IrisAppearance = {
  caseColor: '#2b2d33',
  caseRoughness: 0.35,
  strapColor: '#17181b',
  strapStyle: 'leather',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  dialColor: '#ece6d8',
  ringColor: '#24262b',
  bladeColor: '#3a3e46',
  edgeColor: '#16181c',
  hourTipColor: '#c9a96e',
  secondColor: '#d8452f',
}

export const irisFields: CustomizationField<IrisAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'ringColor', label: 'Rings & numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'bladeColor', label: 'Blades', group: 'Indicators', control: { type: 'color' } },
  { key: 'edgeColor', label: 'Blade edges', group: 'Indicators', control: { type: 'color' } },
  { key: 'hourTipColor', label: 'Hour tip', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Seconds', group: 'Indicators', control: { type: 'color' } },
]
