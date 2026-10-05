import type { CustomizationField } from '../../types/watch'
import type { CrystalAppearance } from './Crystal'
import type { CaseAppearance } from './WatchCase'

/** Customisation fields shared by every watch built on `WatchCase` + `Crystal`. */
export const caseFields: CustomizationField<CaseAppearance & CrystalAppearance>[] = [
  { key: 'caseColor', label: 'Metal colour', group: 'Case', control: { type: 'color' } },
  {
    key: 'caseRoughness',
    label: 'Finish (polished → brushed)',
    group: 'Case',
    control: { type: 'range', min: 0.05, max: 0.8, step: 0.01 },
  },
  {
    key: 'crystalOpacity',
    label: 'Reflection',
    group: 'Crystal',
    control: { type: 'range', min: 0, max: 0.4, step: 0.01 },
  },
  { key: 'crystalTint', label: 'Tint', group: 'Crystal', control: { type: 'color' } },
  {
    key: 'strapStyle',
    label: 'Style',
    group: 'Strap',
    control: {
      type: 'select',
      options: [
        { value: 'leather', label: 'Leather' },
        { value: 'fabric', label: 'Fabric' },
        { value: 'metal', label: 'Metal' },
      ],
    },
  },
  { key: 'strapColor', label: 'Colour', group: 'Strap', control: { type: 'color' } },
]
