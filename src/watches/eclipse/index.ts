import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultEclipseAppearance, eclipseFields } from './appearance'
import { eclipseMetadata } from './metadata'

export const eclipse = defineConcept({
  metadata: eclipseMetadata,
  defaultAppearance: defaultEclipseAppearance,
  customization: eclipseFields,
  Model: lazy(() => import('./EclipseWatch').then((m) => ({ default: m.EclipseWatch }))),
})
