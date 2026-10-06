import type { WatchConcept } from '../types/watch'
import { cipher } from './cipher'
import { eclipse } from './eclipse'
import { lens } from './lens'
import { marble } from './marble'
import { numeralRing } from './numeral-ring'
import { opticalLever } from './optical-lever'
import { orbitalHands } from './orbital-hands'
import { shears } from './shears'
import { turntable } from './turntable'

/** Exhibition order. Add new concepts here. */
export const concepts: WatchConcept[] = [
  orbitalHands,
  numeralRing,
  eclipse,
  shears,
  turntable,
  cipher,
  marble,
  lens,
  opticalLever,
]

export function getConcept(id: string): WatchConcept | undefined {
  return concepts.find((c) => c.metadata.id === id)
}
