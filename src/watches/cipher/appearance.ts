import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type CipherAppearance = CaseAppearance &
  CrystalAppearance & {
    ringColor: string
    glyphColor: string
    windowColor: string
    maskOpacity: number
  }

export const defaultCipherAppearance: CipherAppearance = {
  caseColor: '#3a3d45',
  caseRoughness: 0.4,
  strapColor: '#121317',
  strapStyle: 'metal',
  crystalTint: '#dfe8f0',
  crystalOpacity: 0.1,
  ringColor: '#121318',
  glyphColor: '#d9f2e6',
  windowColor: '#4fd1a5',
  maskOpacity: 0.55,
}

export const cipherFields: CustomizationField<CipherAppearance>[] = [
  ...caseFields,
  { key: 'ringColor', label: 'Rings', group: 'Dial', control: { type: 'color' } },
  { key: 'glyphColor', label: 'Glyphs', group: 'Dial', control: { type: 'color' } },
  {
    key: 'maskOpacity',
    label: 'Mask outside the window',
    group: 'Dial',
    control: { type: 'range', min: 0, max: 0.9, step: 0.01 },
  },
  { key: 'windowColor', label: 'Window frame', group: 'Indicators', control: { type: 'color' } },
]
