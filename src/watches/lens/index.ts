import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultLensAppearance, lensFields } from './appearance'
import { lensMetadata } from './metadata'

export const lens = defineConcept({
  metadata: lensMetadata,
  defaultAppearance: defaultLensAppearance,
  customization: lensFields,
  Model: lazy(() => import('./LensWatch').then((m) => ({ default: m.LensWatch }))),
})
