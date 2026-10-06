import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultOpticalLeverAppearance, opticalLeverFields } from './appearance'
import { opticalLeverMetadata } from './metadata'

export const opticalLever = defineConcept({
  metadata: opticalLeverMetadata,
  defaultAppearance: defaultOpticalLeverAppearance,
  customization: opticalLeverFields,
  Model: lazy(() => import('./OpticalLeverWatch').then((m) => ({ default: m.OpticalLeverWatch }))),
})
