import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type MarbleAppearance = CaseAppearance &
  CrystalAppearance & {
    dishColor: string
    innerDishColor: string
    printColor: string
    hourMarbleColor: string
    minuteMarbleColor: string
  }

export const defaultMarbleAppearance: MarbleAppearance = {
  caseColor: '#cfd2d8',
  caseRoughness: 0.2,
  strapColor: '#2f3a2e',
  strapStyle: 'fabric',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.08,
  dishColor: '#ece7dc',
  innerDishColor: '#d8d1c2',
  printColor: '#2a2c31',
  hourMarbleColor: '#1f3a8a',
  minuteMarbleColor: '#c2410c',
}

export const marbleFields: CustomizationField<MarbleAppearance>[] = [
  ...caseFields,
  { key: 'dishColor', label: 'Hour dish', group: 'Dial', control: { type: 'color' } },
  { key: 'innerDishColor', label: 'Minute dish', group: 'Dial', control: { type: 'color' } },
  { key: 'printColor', label: 'Print', group: 'Dial', control: { type: 'color' } },
  { key: 'hourMarbleColor', label: 'Hour marble', group: 'Indicators', control: { type: 'color' } },
  {
    key: 'minuteMarbleColor',
    label: 'Minute marble',
    group: 'Indicators',
    control: { type: 'color' },
  },
]
