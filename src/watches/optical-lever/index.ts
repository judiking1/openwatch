import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { defaultOpticalLeverAppearance, opticalLeverFields } from './appearance'
import { opticalLeverMetadata } from './metadata'

export const opticalLever = defineConcept({
  metadata: opticalLeverMetadata,
  defaultAppearance: defaultOpticalLeverAppearance,
  customization: opticalLeverFields,
  Model: lazy(() => import('./OpticalLeverWatch').then((m) => ({ default: m.OpticalLeverWatch }))),
  // The beams are unlit HDR colours (additive halos over a white core): only they cross it.
  postFx: { bloom: { strength: 0.6, radius: 0.15, threshold: 1.2 } },
})
