import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultPhaseAppearance, phaseFields } from './appearance'
import { phaseMetadata } from './metadata'

export const phase = defineConcept({
  metadata: phaseMetadata,
  defaultAppearance: defaultPhaseAppearance,
  customization: phaseFields,
  Model: lazy(() => import('./PhaseWatch').then((m) => ({ default: m.PhaseWatch }))),
  // Only the foci, where the waves add up, are bright enough to bloom.
  postFx: { bloom: { strength: 0.6, radius: 0.25, threshold: 1.2 } },
  sound: { kind: 'quiet' },
})
