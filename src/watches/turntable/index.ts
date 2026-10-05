import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultTurntableAppearance, turntableFields } from './appearance'
import { turntableMetadata } from './metadata'

export const turntable = defineConcept({
  metadata: turntableMetadata,
  defaultAppearance: defaultTurntableAppearance,
  customization: turntableFields,
  Model: lazy(() => import('./TurntableWatch').then((m) => ({ default: m.TurntableWatch }))),
})
