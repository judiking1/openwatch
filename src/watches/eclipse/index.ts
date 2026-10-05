import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultEclipseAppearance } from './appearance'
import { eclipseMetadata } from './metadata'

export const eclipse = defineConcept({
  metadata: eclipseMetadata,
  defaultAppearance: defaultEclipseAppearance,
  Model: lazy(() => import('./EclipseWatch').then((m) => ({ default: m.EclipseWatch }))),
})
