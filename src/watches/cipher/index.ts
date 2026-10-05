import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { cipherFields, defaultCipherAppearance } from './appearance'
import { cipherMetadata } from './metadata'

export const cipher = defineConcept({
  metadata: cipherMetadata,
  defaultAppearance: defaultCipherAppearance,
  customization: cipherFields,
  Model: lazy(() => import('./CipherWatch').then((m) => ({ default: m.CipherWatch }))),
})
