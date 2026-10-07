import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultIrisAppearance, irisFields } from './appearance'
import { irisMetadata } from './metadata'

export const iris = defineConcept({
  metadata: irisMetadata,
  defaultAppearance: defaultIrisAppearance,
  customization: irisFields,
  Model: lazy(() => import('./IrisWatch').then((m) => ({ default: m.IrisWatch }))),
})
