import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultPlasmaAppearance, plasmaFields } from './appearance'
import { plasmaMetadata } from './metadata'

export const plasma = defineConcept({
  metadata: plasmaMetadata,
  defaultAppearance: defaultPlasmaAppearance,
  customization: plasmaFields,
  Model: lazy(() => import('./PlasmaWatch').then((m) => ({ default: m.PlasmaWatch }))),
  // Filament cores and the brightest phosphor are unlit HDR colours: only they bloom.
  postFx: { bloom: { strength: 0.7, radius: 0.3, threshold: 1 } },
  sound: { kind: 'quiet' },
})
