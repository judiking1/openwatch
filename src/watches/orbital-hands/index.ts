import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultOrbitalHandsAppearance } from './appearance'
import { orbitalHandsMetadata } from './metadata'

export const orbitalHands = defineConcept({
  metadata: orbitalHandsMetadata,
  defaultAppearance: defaultOrbitalHandsAppearance,
  // Lazy so the gallery does not pull three.js into the main bundle.
  Model: lazy(() => import('./OrbitalHandsWatch').then((m) => ({ default: m.OrbitalHandsWatch }))),
})
