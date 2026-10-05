import type { CustomizationField } from '../../types/watch'
import { caseFields } from '../../three/parts/fields'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CrystalAppearance } from '../../three/parts/Crystal'

export type OrbitalHandsAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    numeralColor: string
    hourColor: string
    minuteColor: string
    secondColor: string
    trackColor: string
  }

export const defaultOrbitalHandsAppearance: OrbitalHandsAppearance = {
  caseColor: '#c9cbd1',
  caseRoughness: 0.28,
  strapColor: '#2b2420',
  strapStyle: 'leather',
  crystalTint: '#dfe8f0',
  crystalOpacity: 0.12,
  dialColor: '#121318',
  numeralColor: '#e8e4da',
  hourColor: '#e8e4da',
  minuteColor: '#c9a96e',
  secondColor: '#e0533d',
  trackColor: '#3a3d4a',
}

export const orbitalHandsFields: CustomizationField<OrbitalHandsAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'numeralColor', label: 'Numerals', group: 'Dial', control: { type: 'color' } },
  { key: 'trackColor', label: 'Orbit tracks', group: 'Dial', control: { type: 'color' } },
  { key: 'hourColor', label: 'Hour', group: 'Indicators', control: { type: 'color' } },
  { key: 'minuteColor', label: 'Minute', group: 'Indicators', control: { type: 'color' } },
  { key: 'secondColor', label: 'Second', group: 'Indicators', control: { type: 'color' } },
]
