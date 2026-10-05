import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultShearsAppearance, shearsFields } from './appearance'
import { shearsMetadata } from './metadata'

export const shears = defineConcept({
  metadata: shearsMetadata,
  defaultAppearance: defaultShearsAppearance,
  customization: shearsFields,
  Model: lazy(() => import('./ShearsWatch').then((m) => ({ default: m.ShearsWatch }))),
})
