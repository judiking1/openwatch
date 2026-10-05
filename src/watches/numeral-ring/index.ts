import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultNumeralRingAppearance } from './appearance'
import { numeralRingMetadata } from './metadata'

export const numeralRing = defineConcept({
  metadata: numeralRingMetadata,
  defaultAppearance: defaultNumeralRingAppearance,
  Model: lazy(() => import('./NumeralRingWatch').then((m) => ({ default: m.NumeralRingWatch }))),
})
