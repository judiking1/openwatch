import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type PhaseAppearance = CaseAppearance &
  CrystalAppearance & {
    dialColor: string
    printColor: string
    emitterColor: string
    hourWaveColor: string
    minuteWaveColor: string
    secondColor: string
  }

export const defaultPhaseAppearance: PhaseAppearance = {
  caseColor: '#4a4f58',
  caseRoughness: 0.35,
  strapColor: '#1d2433',
  strapStyle: 'fabric',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
  dialColor: '#070b14',
  printColor: '#7d8aa3',
  emitterColor: '#c9a96e',
  hourWaveColor: '#ffb35c',
  minuteWaveColor: '#5cd6ff',
  secondColor: '#ff5a4a',
}

export const phaseFields: CustomizationField<PhaseAppearance>[] = [
  ...caseFields,
  { key: 'dialColor', label: 'Background', group: 'Dial', control: { type: 'color' } },
  { key: 'printColor', label: 'Scales', group: 'Dial', control: { type: 'color' } },
  { key: 'emitterColor', label: 'Emitters', group: 'Dial', control: { type: 'color' } },
  { key: 'hourWaveColor', label: 'Hour waves', group: 'Indicators', control: { type: 'color' } },
  {
    key: 'minuteWaveColor',
    label: 'Minute waves',
    group: 'Indicators',
    control: { type: 'color' },
  },
  { key: 'secondColor', label: 'Seconds', group: 'Indicators', control: { type: 'color' } },
]
