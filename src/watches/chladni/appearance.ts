import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type ChladniAppearance = CaseAppearance &
  CrystalAppearance & {
    plateColor: string
    sandColor: string
    scaleColor: string
    rimColor: string
    numeralColor: string
    exciterColor: string
  }

export const defaultChladniAppearance: ChladniAppearance = {
  caseColor: '#b9bcc2',
  caseRoughness: 0.3,
  strapColor: '#2a2420',
  strapStyle: 'leather',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  plateColor: '#1d2026',
  sandColor: '#e3cf9f',
  scaleColor: '#59606c',
  rimColor: '#2b2f36',
  numeralColor: '#d9d4c6',
  exciterColor: '#c9a96e',
}

export const chladniFields: CustomizationField<ChladniAppearance>[] = [
  ...caseFields,
  { key: 'plateColor', label: 'Plate', group: 'Dial', control: { type: 'color' } },
  { key: 'scaleColor', label: 'Minute circles', group: 'Dial', control: { type: 'color' } },
  { key: 'rimColor', label: 'Rim', group: 'Dial', control: { type: 'color' } },
  { key: 'numeralColor', label: 'Hour numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'sandColor', label: 'Sand', group: 'Indicators', control: { type: 'color' } },
  { key: 'exciterColor', label: 'Exciter', group: 'Indicators', control: { type: 'color' } },
]
