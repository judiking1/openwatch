import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { angbuilguFields, defaultAngbuilguAppearance } from './appearance'
import { angbuilguMetadata } from './metadata'

export const angbuilgu = defineConcept({
  metadata: angbuilguMetadata,
  defaultAppearance: defaultAngbuilguAppearance,
  customization: angbuilguFields,
  Model: lazy(() => import('./AngbuilguWatch').then((m) => ({ default: m.AngbuilguWatch }))),
})
