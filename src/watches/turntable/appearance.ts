import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type TurntableAppearance = CaseAppearance &
  CrystalAppearance & {
    bezelColor: string
    bezelNumeralColor: string
    dialColor: string
    scaleColor: string
    handColor: string
    secondColor: string
    indexColor: string
  }

export const defaultTurntableAppearance: TurntableAppearance = {
  caseColor: '#b9bcc4',
  caseRoughness: 0.32,
  strapColor: '#6b3a24',
  strapStyle: 'leather',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  bezelColor: '#15171c',
  bezelNumeralColor: '#f1ede2',
  dialColor: '#1d3b36',
  scaleColor: '#e8e4da',
  handColor: '#f1ede2',
  secondColor: '#e0533d',
  indexColor: '#c9a96e',
}

export const turntableFields: CustomizationField<TurntableAppearance>[] = [
  ...caseFields,
  { key: 'bezelColor', label: 'Bezel', group: 'Case', control: { type: 'color' } },
  { key: 'bezelNumeralColor', label: 'Bezel hours', group: 'Case', control: { type: 'color' } },
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'scaleColor', label: 'Minute scale', group: 'Dial', control: { type: 'color' } },
  { key: 'handColor', label: 'Minute hand', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Seconds hand', group: 'Indicators', control: { type: 'color' } },
  { key: 'indexColor', label: 'Strap index', group: 'Strap', control: { type: 'color' } },
]
