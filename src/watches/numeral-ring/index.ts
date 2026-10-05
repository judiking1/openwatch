import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultNumeralRingAppearance, numeralRingFields } from './appearance'
import { numeralRingMetadata } from './metadata'

export const numeralRing = defineConcept({
  metadata: numeralRingMetadata,
  defaultAppearance: defaultNumeralRingAppearance,
  customization: numeralRingFields,
  Model: lazy(() => import('./NumeralRingWatch').then((m) => ({ default: m.NumeralRingWatch }))),
})
