import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultMarbleAppearance, marbleFields } from './appearance'
import { marbleMetadata } from './metadata'

export const marble = defineConcept({
  metadata: marbleMetadata,
  defaultAppearance: defaultMarbleAppearance,
  customization: marbleFields,
  Model: lazy(() => import('./MarbleWatch').then((m) => ({ default: m.MarbleWatch }))),
})
