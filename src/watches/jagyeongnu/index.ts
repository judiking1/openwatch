import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { DROP_IMPACT } from './waterClock'
import { defaultJagyeongnuAppearance, jagyeongnuFields } from './appearance'
import { jagyeongnuMetadata } from './metadata'

export const jagyeongnu = defineConcept({
  metadata: jagyeongnuMetadata,
  defaultAppearance: defaultJagyeongnuAppearance,
  customization: jagyeongnuFields,
  Model: lazy(() => import('./JagyeongnuWatch').then((m) => ({ default: m.JagyeongnuWatch }))),
  sound: { kind: 'drop', offset: DROP_IMPACT },
})
