import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { chladniFields, defaultChladniAppearance } from './appearance'
import { chladniMetadata } from './metadata'

export const chladni = defineConcept({
  metadata: chladniMetadata,
  defaultAppearance: defaultChladniAppearance,
  customization: chladniFields,
  Model: lazy(() => import('./ChladniWatch').then((m) => ({ default: m.ChladniWatch }))),
  // The plate is driven by a transducer, not an escapement.
  sound: { kind: 'quiet' },
})
